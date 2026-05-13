import { Settings, Bell, Shield, Database, Loader2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppSettings, useToggleSetting } from '@/hooks/use-app-settings';
import { usePlatformFeePercent, useUpdatePlatformFeePercent } from '@/hooks/use-platform-fee';
import { useEffect, useState } from 'react';

export default function AdminSettings() {
  const { data: settings, isLoading } = useAppSettings();
  const { mutate: toggleSetting, isPending } = useToggleSetting();
  const { data: platformFee = 10, isLoading: feeLoading } = usePlatformFeePercent();
  const { mutate: updatePlatformFee, isPending: feeSaving } = useUpdatePlatformFeePercent();
  const [feeInput, setFeeInput] = useState<string>('10');

  useEffect(() => {
    setFeeInput(String(platformFee));
  }, [platformFee]);

  const handleToggle = (key: Parameters<typeof toggleSetting>[0]['key'], enabled: boolean) => {
    toggleSetting({ key, enabled });
  };

  const getSettingEnabled = (key: string): boolean => {
    if (!settings || !settings[key as keyof typeof settings]) return false;
    return (settings[key as keyof typeof settings].value as { enabled?: boolean })?.enabled ?? false;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 mt-1">Configure platform settings and preferences</p>
        </div>
        {isPending && (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Saving...</span>
          </div>
        )}
      </div>

      <div className="max-w-2xl space-y-8">
        {/* Monetization */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Monetization</h2>
          </div>

          {feeLoading ? (
            <Skeleton className="h-14 bg-slate-700" />
          ) : (
            <div className="space-y-3">
              <div>
                <Label className="text-white">Platform Fee (% of cash prize pool)</Label>
                <p className="text-sm text-slate-400 mb-3">
                  Applied to every cash-prize challenge (fishing & photo). Affects new payouts globally. No fee on gift-card prizes.
                </p>
                <div className="flex items-center gap-3 max-w-xs">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={feeInput}
                    onChange={(e) => setFeeInput(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <span className="text-slate-400">%</span>
                  <Button
                    onClick={() => updatePlatformFee(parseFloat(feeInput) || 0)}
                    disabled={feeSaving || parseFloat(feeInput) === platformFee}
                  >
                    {feeSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Winners currently receive <span className="font-semibold text-slate-300">{Math.max(0, 100 - platformFee)}%</span> of the pool.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* General Settings */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <Settings className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">General Settings</h2>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-14 bg-slate-700" />
              <Skeleton className="h-14 bg-slate-700" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Maintenance Mode</Label>
                  <p className="text-sm text-slate-400">Temporarily disable the platform for maintenance</p>
                </div>
                <Switch 
                  checked={getSettingEnabled('maintenance_mode')}
                  onCheckedChange={(checked) => handleToggle('maintenance_mode', checked)}
                  disabled={isPending}
                />
              </div>
              <Separator className="bg-slate-700" />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">New User Registration</Label>
                  <p className="text-sm text-slate-400">Allow new users to sign up</p>
                </div>
                <Switch 
                  checked={getSettingEnabled('registration_enabled')}
                  onCheckedChange={(checked) => handleToggle('registration_enabled', checked)}
                  disabled={isPending}
                />
              </div>
            </div>
          )}
        </div>


        {/* Notifications */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-violet-500/20">
              <Bell className="w-5 h-5 text-violet-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-14 bg-slate-700" />
              <Skeleton className="h-14 bg-slate-700" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Email Notifications</Label>
                  <p className="text-sm text-slate-400">Send admin alerts via email</p>
                </div>
                <Switch 
                  checked={getSettingEnabled('email_notifications')}
                  onCheckedChange={(checked) => handleToggle('email_notifications', checked)}
                  disabled={isPending}
                />
              </div>
              <Separator className="bg-slate-700" />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">New Report Alerts</Label>
                  <p className="text-sm text-slate-400">Get notified when new reports are filed</p>
                </div>
                <Switch 
                  checked={getSettingEnabled('report_alerts')}
                  onCheckedChange={(checked) => handleToggle('report_alerts', checked)}
                  disabled={isPending}
                />
              </div>
            </div>
          )}
        </div>

        {/* Security */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-rose-500/20">
              <Shield className="w-5 h-5 text-rose-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Security</h2>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-14 bg-slate-700" />
              <Skeleton className="h-14 bg-slate-700" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Two-Factor Authentication</Label>
                  <p className="text-sm text-slate-400">Require 2FA for admin accounts</p>
                </div>
                <Switch 
                  checked={getSettingEnabled('require_2fa')}
                  onCheckedChange={(checked) => handleToggle('require_2fa', checked)}
                  disabled={isPending}
                />
              </div>
              <Separator className="bg-slate-700" />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Session Timeout</Label>
                  <p className="text-sm text-slate-400">Auto-logout after 30 minutes of inactivity</p>
                </div>
                <Switch 
                  checked={getSettingEnabled('session_timeout')}
                  onCheckedChange={(checked) => handleToggle('session_timeout', checked)}
                  disabled={isPending}
                />
              </div>
            </div>
          )}
        </div>

        {/* Database */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Database className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Database</h2>
          </div>

          <p className="text-slate-400 mb-4">Database management and backup options.</p>
          
          <div className="flex gap-3">
            <Button variant="outline" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
              Export Data
            </Button>
            <Button variant="outline" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
              View Logs
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
