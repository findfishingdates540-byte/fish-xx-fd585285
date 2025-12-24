import { Settings, Fish, Bell, Shield, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function AdminSettings() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 mt-1">Configure platform settings and preferences</p>
        </div>
      </div>

      <div className="max-w-2xl space-y-8">
        {/* General Settings */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <Settings className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">General Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Maintenance Mode</Label>
                <p className="text-sm text-slate-400">Temporarily disable the platform for maintenance</p>
              </div>
              <Switch />
            </div>
            <Separator className="bg-slate-700" />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">New User Registration</Label>
                <p className="text-sm text-slate-400">Allow new users to sign up</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-violet-500/20">
              <Bell className="w-5 h-5 text-violet-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Email Notifications</Label>
                <p className="text-sm text-slate-400">Send admin alerts via email</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-slate-700" />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">New Report Alerts</Label>
                <p className="text-sm text-slate-400">Get notified when new reports are filed</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-rose-500/20">
              <Shield className="w-5 h-5 text-rose-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Security</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Two-Factor Authentication</Label>
                <p className="text-sm text-slate-400">Require 2FA for admin accounts</p>
              </div>
              <Switch />
            </div>
            <Separator className="bg-slate-700" />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Session Timeout</Label>
                <p className="text-sm text-slate-400">Auto-logout after 30 minutes of inactivity</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Fish Species Management */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Fish className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Fish Species</h2>
          </div>

          <p className="text-slate-400 mb-4">Manage the list of fish species available on the platform.</p>
          
          <Button variant="outline" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
            Manage Species List
          </Button>
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
