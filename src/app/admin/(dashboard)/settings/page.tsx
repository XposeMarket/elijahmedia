import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/admin/SettingsForm'

async function getSettings() {
  const supabase = await createClient()
  const orgId = process.env.PHOTOGRAPHER_ORG_ID

  if (!orgId) {
    return {
      hero: {
        background_url: null,
        overlay_opacity: 0.7,
        overlay_color: '#000000',
        title: 'Elijah Media',
        subtitle: 'Capturing moments, creating memories',
      }
    }
  }

  const { data } = await supabase
    .from('site_settings')
    .select('setting_key, setting_value')
    .eq('org_id', orgId)

  const settings: Record<string, unknown> = {}
  
  if (data) {
    for (const row of data) {
      settings[row.setting_key] = row.setting_value
    }
  }

  // Merge with defaults
  return {
    hero: {
      background_url: null,
      overlay_opacity: 0.7,
      overlay_color: '#000000',
      title: 'Elijah Media',
      subtitle: 'Capturing moments, creating memories',
      ...(settings.hero as object || {}),
    }
  }
}

export default async function AdminSettingsPage() {
  const settings = await getSettings()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Site Settings</h1>
        <p className="text-neutral-400 mt-1">Customize your portfolio site appearance</p>
      </div>

      <SettingsForm initialSettings={settings} />
    </div>
  )
}
