export type DefaultArtworkSource = 'none' | 'steam' | 'steamGridDb'
export type LauncherMode = 'always' | 'whenRequired' | 'whenNoExecutable'

export interface Settings {
	stopSteam: boolean
	restartSteam: boolean
	createCollections: boolean
	addSelfShortcut: boolean
	steamLocation: string | null
	sources: Record<string, SourceSettings>
	steamGridDb: SteamGridDbSettings
	defaultArtworkSource: DefaultArtworkSource
	launcherMode: LauncherMode
	locale: string | null
	colorScheme: string | null
	updateNotifications: boolean
}

export interface SourceSettings {
	enabled: boolean
	customPath: string | null
}

export interface SteamGridDbSettings {
	enabled: boolean
	apiKey: string | null
	allowNsfw: boolean
}
