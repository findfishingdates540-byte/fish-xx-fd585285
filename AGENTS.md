# Project Architecture Decisions

- Global route scroll management stores positions by React Router history entry, restores them on browser Back, and starts new forward navigations at the top so users return to their previous list context.