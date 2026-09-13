<script setup lang="ts">
import { CheckCircle2, Clock, Loader2, Star } from '@lucide/vue'
import { getVersion } from '@tauri-apps/api/app'
import { openUrl } from '@tauri-apps/plugin-opener'
import { relaunch } from '@tauri-apps/plugin-process'
import { check, type Update } from '@tauri-apps/plugin-updater'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import KofiIcon from '../assets/icons/kofi.svg?component'
import { useAppState } from '../composables/useAppState'
import UpdateAvailableModal, { type UpdateStatus } from './UpdateAvailableModal.vue'

defineSlots<{
	default?: () => unknown
	footer?: () => unknown
}>()

const { t } = useI18n()
const state = useAppState()

const RELEASES_URL = 'https://github.com/creeperkatze/full-steam-ahead/releases/latest'
const DISMISSED_VERSION_KEY = 'dismissedUpdateVersion'

const version = ref('')
const updateChecking = ref(true)
const isLatest = ref(false)
const update = ref<Update | null>(null)
const showUpdateModal = ref(false)
const updateStatus = ref<UpdateStatus>('available')
const updateProgress = ref(0)
const updateErrorMessage = ref('')

async function checkForUpdates() {
	try {
		const result = await check()
		if (result) update.value = result
		else isLatest.value = true
	} catch {
		// Silently ignore
	} finally {
		updateChecking.value = false
	}
}

watch([update, () => state.settingsReady.value], ([u, ready]) => {
	if (!ready || !u) return
	if (!state.settings.updateNotifications) return
	if (u.version === window.localStorage.getItem(DISMISSED_VERSION_KEY)) return
	showUpdateModal.value = true
})

function openUpdateModal() {
	showUpdateModal.value = true
}

function dismissUpdateModal() {
	if (update.value) {
		window.localStorage.setItem(DISMISSED_VERSION_KEY, update.value.version)
	}
	showUpdateModal.value = false
}

async function startUpdate() {
	if (!update.value) return
	updateStatus.value = 'downloading'
	updateProgress.value = 0
	let totalLength = 0
	let downloaded = 0
	try {
		await update.value.downloadAndInstall((event) => {
			if (event.event === 'Started') {
				totalLength = event.data.contentLength ?? 0
			} else if (event.event === 'Progress') {
				downloaded += event.data.chunkLength
				updateProgress.value = totalLength ? downloaded / totalLength : 0
			} else if (event.event === 'Finished') {
				updateProgress.value = 1
			}
		})
		updateStatus.value = 'ready'
	} catch (error) {
		updateErrorMessage.value = error instanceof Error ? error.message : String(error)
		updateStatus.value = 'error'
	}
}

onMounted(async () => {
	version.value = await getVersion().catch(() => '')
	await checkForUpdates()
})
</script>

<template>
	<main class="flex min-h-0 flex-1 flex-col px-4 pb-2 text-primary">
		<div
			class="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-xl border border-border bg-surface-1 p-4"
		>
			<slot />
		</div>

		<div class="grid shrink-0 grid-cols-[1fr_auto_1fr] items-end gap-3 pt-2">
			<div class="flex min-w-0 items-center gap-2">
				<span class="shrink-0 text-sm text-secondary">v{{ version }}</span>
				<span v-if="updateChecking" class="flex min-w-0 items-center gap-1 text-sm text-secondary">
					<Loader2 class="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
					<span class="truncate">{{ t('appShell.checkingForUpdates') }}</span>
				</span>
				<button
					v-else-if="isLatest"
					type="button"
					class="flex min-w-0 cursor-pointer items-center gap-1 text-sm text-green-500 transition-colors hover:text-green-400"
					@click="openUrl(RELEASES_URL)"
				>
					<CheckCircle2 class="size-3.5 shrink-0" aria-hidden="true" />
					<span class="truncate">{{ t('appShell.latestVersion') }}</span>
				</button>
				<button
					v-else-if="update"
					type="button"
					class="flex min-w-0 cursor-pointer items-center gap-1 text-sm text-yellow-500 transition-colors hover:text-yellow-300"
					@click="openUpdateModal"
				>
					<Clock class="size-3.5 shrink-0" aria-hidden="true" />
					<span class="truncate">{{ t('appShell.updateAvailable') }}</span>
				</button>
			</div>
			<div class="flex min-h-9 items-center gap-2">
				<slot name="footer" />
			</div>
			<div class="flex items-center justify-end gap-3">
				<button
					type="button"
					class="flex shrink-0 cursor-pointer items-center gap-1 text-sm text-[#FF5E5B] transition-colors hover:text-[#ff8e8c]"
					@click="openUrl('https://ko-fi.com/creeperkatze')"
				>
					<KofiIcon class="size-4" aria-hidden="true" />
					<span>{{ t('appShell.donate') }}</span>
				</button>
				<button
					type="button"
					class="flex shrink-0 cursor-pointer items-center gap-1 text-sm text-yellow-500 transition-colors hover:text-yellow-300"
					@click="openUrl('https://github.com/creeperkatze/full-steam-ahead')"
				>
					<Star class="size-4 shrink-0" aria-hidden="true" />
					<span>{{ t('appShell.onGithub') }}</span>
				</button>
			</div>
		</div>
	</main>

	<UpdateAvailableModal
		v-if="update"
		:model-value="showUpdateModal"
		:current-version="version"
		:latest-version="update.version"
		:status="updateStatus"
		:progress="updateProgress"
		:error-message="updateErrorMessage"
		@update:model-value="dismissUpdateModal"
		@update="startUpdate"
		@restart="relaunch"
	/>
</template>
