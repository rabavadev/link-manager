<script setup lang="ts">
import {
  AlertCircle,
  CheckCircle,
  ClipboardPaste,
  Download,
  FileJson,
  SkipForward,
  Trash2,
  Upload,
  XCircle,
} from '@lucide/vue'

const { previewMode } = useRuntimeConfig().public
const fileInputRef = useTemplateRef<HTMLInputElement>('fileInputRef')
const inputMode = ref<'file' | 'paste'>('file')
const pastedJson = ref('')
const isDragging = ref(false)

const {
  selectedFile,
  parsedData,
  parseError,
  validationErrors,
  isImporting,
  importProgress,
  importResult,
  handleFile,
  handleJsonText,
  clearError,
  importLinks,
  downloadSuccessItems,
  downloadSkippedItems,
  downloadFailedItems,
  reset,
} = useLinkImport()

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file)
    void handleFile(file)
}

function handlePasteSubmit() {
  if (previewMode || isImporting.value || !pastedJson.value.trim())
    return
  void handleJsonText(pastedJson.value, 'pasted-data.json')
}

function resetForm() {
  reset()
  pastedJson.value = ''
  if (fileInputRef.value)
    fileInputRef.value.value = ''
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle><h2>{{ $t('migrate.import.title') }}</h2></CardTitle>
      <CardDescription>{{ $t('migrate.import.description') }}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <Alert v-if="parseError" variant="destructive">
        <AlertCircle aria-hidden="true" />
        <AlertTitle>{{ parseError }}</AlertTitle>
        <AlertDescription>
          <div v-if="validationErrors.length > 0" class="mt-2 space-y-1">
            <p
              v-for="(error, index) in validationErrors"
              :key="index"
              class="font-mono text-xs"
            >
              {{ error }}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            class="mt-3"
            :disabled="isImporting"
            @click="clearError"
          >
            {{ $t('common.try_again') }}
          </Button>
        </AlertDescription>
      </Alert>

      <div v-if="!parsedData && !importResult" class="space-y-4">
        <div class="grid w-full grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-all"
            :class="inputMode === 'file' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
            @click="inputMode = 'file'"
          >
            <Upload class="mr-2 size-4" />
            {{ $t('migrate.import.tab_file') }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-all"
            :class="inputMode === 'paste' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
            @click="inputMode = 'paste'"
          >
            <ClipboardPaste class="mr-2 size-4" />
            {{ $t('migrate.import.tab_paste') }}
          </button>
        </div>

        <div v-show="inputMode === 'file'" class="pt-2">
          <div
            class="
              relative flex flex-col items-center justify-center
              rounded-xl border-2 border-dashed p-8 text-center
              transition-all select-none
            "
            :class="[
              isDragging
                ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                : `
                  border-border/80
                  hover:border-primary/60 hover:bg-muted/40
                `,
              previewMode ? 'cursor-not-allowed opacity-60' : '',
            ]"
          >
            <input
              ref="fileInputRef"
              type="file"
              accept=".json,application/json"
              class="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
              :disabled="previewMode"
              @dragover="isDragging = true"
              @dragenter="isDragging = true"
              @dragleave="isDragging = false"
              @drop="isDragging = false"
              @change="handleFileSelect"
            >
            <div class="pointer-events-none flex flex-col items-center justify-center">
              <div class="mb-3 rounded-full bg-primary/10 p-3 text-primary">
                <Upload class="size-6" />
              </div>
              <p class="text-sm font-semibold text-foreground">
                {{ $t('migrate.import.dropzone') }}
              </p>
              <p class="mt-1 text-xs text-muted-foreground">
                .json
              </p>
              <div class="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  tabindex="-1"
                  :disabled="previewMode"
                >
                  <FileJson class="mr-2 size-4" />
                  {{ $t('migrate.import.choose_file') }}
                </Button>
              </div>
            </div>
          </div>
          <p v-if="previewMode" class="mt-2 text-sm text-muted-foreground">
            {{ $t('migrate.import.preview_mode_tip') }}
          </p>
        </div>

        <div v-show="inputMode === 'paste'" class="space-y-3 pt-2">
          <div class="flex items-center justify-between">
            <span class="text-xs text-muted-foreground">
              {{ $t('migrate.import.paste_description') }}
            </span>
            <Button
              v-if="pastedJson.trim()"
              type="button"
              variant="ghost"
              size="sm"
              class="
                h-7 px-2 text-xs text-muted-foreground
                hover:text-foreground
              "
              @click="pastedJson = ''"
            >
              <Trash2 class="mr-1 size-3" />
              {{ $t('migrate.import.clear') }}
            </Button>
          </div>
          <Textarea
            v-model="pastedJson"
            :rows="8"
            :placeholder="$t('migrate.import.paste_placeholder')"
            class="max-h-72 resize-y font-mono text-xs"
            :disabled="previewMode"
          />
          <div class="flex justify-end">
            <Button
              type="button"
              :disabled="!pastedJson.trim() || previewMode"
              @click="handlePasteSubmit"
            >
              <ClipboardPaste class="mr-2 size-4" />
              {{ $t('migrate.import.paste_button') }}
            </Button>
          </div>
          <p v-if="previewMode" class="mt-2 text-sm text-muted-foreground">
            {{ $t('migrate.import.preview_mode_tip') }}
          </p>
        </div>
      </div>

      <div v-if="parsedData && !importResult" class="space-y-4">
        <div class="rounded-lg border bg-muted/30 p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="rounded-md bg-primary/10 p-2 text-primary">
                <FileJson class="size-5" />
              </div>
              <div>
                <p class="font-medium">
                  {{ selectedFile?.name ?? 'links.json' }}
                </p>
                <p class="text-sm text-muted-foreground tabular-nums">
                  {{ $t('migrate.import.links_found', { count: parsedData.links.length }) }}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              :aria-label="$t('migrate.import.import_more')"
              :disabled="isImporting"
              @click="resetForm"
            >
              <XCircle aria-hidden="true" class="size-4" />
            </Button>
          </div>
        </div>

        <div v-if="isImporting" class="space-y-2" role="status" aria-live="polite">
          <div class="flex items-center justify-between text-sm">
            <span>{{ $t('migrate.import.importing') }}</span>
            <span class="tabular-nums">{{ importProgress }}%</span>
          </div>
          <Progress
            :model-value="importProgress"
            :aria-label="$t('migrate.import.importing')"
            :aria-valuetext="`${importProgress}%`"
          />
        </div>

        <Button
          v-else
          class="w-full"
          :disabled="previewMode"
          @click="importLinks"
        >
          <Upload aria-hidden="true" class="size-4" />
          {{ $t('migrate.import.button') }}
        </Button>
      </div>

      <div v-if="importResult" class="space-y-4">
        <Alert role="status">
          <AlertTitle>
            {{ $t('migrate.import.result.title') }}
          </AlertTitle>
          <AlertDescription>
            <div class="space-y-2">
              <div class="flex items-center gap-2 text-sm">
                <CheckCircle aria-hidden="true" class="size-4" />
                <span class="tabular-nums">{{ $t('migrate.import.result.success') }}: {{ importResult.success }}</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <SkipForward
                  aria-hidden="true" class="size-4 text-muted-foreground"
                />
                <span class="tabular-nums">{{ $t('migrate.import.result.skipped') }}: {{ importResult.skipped }}</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-destructive">
                <XCircle aria-hidden="true" class="size-4 text-destructive" />
                <span class="tabular-nums">{{ $t('migrate.import.result.failed') }}: {{ importResult.failed }}</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <div class="flex flex-wrap gap-2">
          <Button
            variant="outline"
            :disabled="isImporting"
            @click="resetForm"
          >
            {{ $t('migrate.import.import_more') }}
          </Button>
          <Button
            v-if="importResult.success > 0"
            variant="default"
            class="tabular-nums"
            @click="downloadSuccessItems"
          >
            <Download aria-hidden="true" class="size-4" />
            {{ $t('migrate.import.download_success', { count: importResult.success }) }}
          </Button>
          <Button
            v-if="importResult.skipped > 0"
            variant="secondary"
            class="tabular-nums"
            @click="downloadSkippedItems"
          >
            <Download aria-hidden="true" class="size-4" />
            {{ $t('migrate.import.download_skipped', { count: importResult.skipped }) }}
          </Button>
          <Button
            v-if="importResult.failed > 0"
            variant="outline"
            class="tabular-nums"
            @click="downloadFailedItems"
          >
            <Download aria-hidden="true" class="size-4" />
            {{ $t('migrate.import.download_failed', { count: importResult.failed }) }}
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
