
CREATE OR REPLACE FUNCTION public.notify_tournament_matchup_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tournament RECORD;
  v_round RECORD;
  v_team1 RECORD;
  v_team2 RECORD;
  v_winner_team_id uuid;
  v_loser_team_id uuid;
  v_winner_name text;
  v_loser_name text;
  v_has_next boolean;
  v_member uuid;
BEGIN
  IF NEW.status <> 'completed' THEN
    RETURN NEW;
  END IF;
  IF OLD.status = 'completed' AND OLD.winner_team_id IS NOT DISTINCT FROM NEW.winner_team_id THEN
    RETURN NEW;
  END IF;
  IF NEW.team1_id IS NULL OR NEW.team2_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id, title INTO v_tournament FROM tournaments WHERE id = NEW.tournament_id;
  SELECT round_name, round_number INTO v_round FROM tournament_rounds WHERE id = NEW.round_id;
  SELECT id, name, captain_id INTO v_team1 FROM fishing_teams WHERE id = NEW.team1_id;
  SELECT id, name, captain_id INTO v_team2 FROM fishing_teams WHERE id = NEW.team2_id;

  v_winner_team_id := NEW.winner_team_id;
  IF v_winner_team_id = NEW.team1_id THEN
    v_loser_team_id := NEW.team2_id;
    v_winner_name := v_team1.name;
    v_loser_name := v_team2.name;
  ELSIF v_winner_team_id = NEW.team2_id THEN
    v_loser_team_id := NEW.team1_id;
    v_winner_name := v_team2.name;
    v_loser_name := v_team1.name;
  END IF;

  v_has_next := NEW.next_matchup_id IS NOT NULL;

  -- "Match complete" for every member of both teams
  FOR v_member IN
    SELECT DISTINCT user_id FROM tournament_team_roster
    WHERE tournament_id = NEW.tournament_id
      AND team_id IN (NEW.team1_id, NEW.team2_id)
      AND user_id IS NOT NULL
  LOOP
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      v_member,
      'tournament_matchup_completed',
      'Match complete',
      v_team1.name || ' ' || COALESCE(NEW.team1_score, 0) || ' – ' ||
        COALESCE(NEW.team2_score, 0) || ' ' || v_team2.name,
      jsonb_build_object(
        'tournament_id', NEW.tournament_id,
        'matchup_id', NEW.id,
        'round_name', v_round.round_name,
        'winner_team_id', v_winner_team_id
      )
    );
  END LOOP;

  -- Advanced / Champion for the winning team
  IF v_winner_team_id IS NOT NULL THEN
    FOR v_member IN
      SELECT DISTINCT user_id FROM tournament_team_roster
      WHERE tournament_id = NEW.tournament_id
        AND team_id = v_winner_team_id
        AND user_id IS NOT NULL
    LOOP
      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES (
        v_member,
        CASE WHEN v_has_next THEN 'tournament_team_advanced' ELSE 'tournament_team_champion' END,
        CASE WHEN v_has_next THEN '🎯 Team advances' ELSE '🏆 Tournament Champion!' END,
        CASE
          WHEN v_has_next THEN v_winner_name || ' advances past ' || v_round.round_name || ' in "' || v_tournament.title || '"'
          ELSE v_winner_name || ' won "' || v_tournament.title || '"!'
        END,
        jsonb_build_object(
          'tournament_id', NEW.tournament_id,
          'matchup_id', NEW.id,
          'round_name', v_round.round_name,
          'team_id', v_winner_team_id
        )
      );
    END LOOP;
  END IF;

  -- Eliminated for losing team
  IF v_loser_team_id IS NOT NULL THEN
    FOR v_member IN
      SELECT DISTINCT user_id FROM tournament_team_roster
      WHERE tournament_id = NEW.tournament_id
        AND team_id = v_loser_team_id
        AND user_id IS NOT NULL
    LOOP
      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES (
        v_member,
        'tournament_team_eliminated',
        'Eliminated',
        v_loser_name || ' was eliminated in ' || v_round.round_name || ' of "' || v_tournament.title || '"',
        jsonb_build_object(
          'tournament_id', NEW.tournament_id,
          'matchup_id', NEW.id,
          'round_name', v_round.round_name,
          'team_id', v_loser_team_id
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_tournament_matchup_complete failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tournament_matchup_notify ON public.tournament_matchups;
CREATE TRIGGER trg_tournament_matchup_notify
AFTER UPDATE ON public.tournament_matchups
FOR EACH ROW
EXECUTE FUNCTION public.notify_tournament_matchup_complete();
