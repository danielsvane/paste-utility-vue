<template>
    <Card title="Semi-Automatic Job">
        <div class="space-y-6">
            <!-- Extrude Controls -->
            <div class="flex gap-3 flex-wrap">
                <Button text="Start Slow Extrude" @click="job.startSlowExtrude()" />
                <Button text="Stop Extrude" @click="job.stopExtrude()" />
                <Button text="Retract & Raise" @click="job.retractAndRaise()" />
            </div>

            <div class="flex gap-3 flex-wrap">
                <Button text="Start Semi-Automatic Job" @click="handleStartSemiAutoJob" type="primary" />
            </div>

            <div class="flex gap-3 flex-wrap">
                <Button text="Extrude Next Position" @click="handleExtrudeNextPosition" />
                <Button :disabled="!canContinueAutomatically" :text="continueButtonText"
                    @click="handleContinueAutomatically" />
                <Button text="Reset Timer" @click="handleResetTimer" />
            </div>

            <div class="text-center text-goldenrod text-sm p-2 bg-gray-700 rounded">
                {{ timingStatusText }}
            </div>
        </div>
    </Card>
</template>

<script setup>
import { computed, inject } from 'vue'
import { useJobStore } from '../stores/job'
import Button from './Button.vue'
import Card from './Card.vue'

const job = useJobStore()
const toast = inject('toast')

// Computed property to enable/disable "Continue Automatically" button
const canContinueAutomatically = computed(() => {
    return job.extrusionTimings.length >= 2 && job.autoExtrusionDuration !== null
})

// Dynamic button text showing average timing
const continueButtonText = computed(() => {
    if (canContinueAutomatically.value) {
        return `Continue Automatically (avg: ${(job.autoExtrusionDuration / 1000).toFixed(1)}s)`
    }
    return 'Continue Automatically'
})

// Timing status display text
const timingStatusText = computed(() => {
    if (job.isLearningMode) {
        if (job.extrusionTimings.length === 0) {
            return 'Manual mode - learning extrusion times'
        } else {
            const average = job.extrusionTimings.reduce((a, b) => a + b, 0) / job.extrusionTimings.length
            return `${job.extrusionTimings.length} pad(s) timed | Average: ${(average / 1000).toFixed(2)}s`
        }
    } else {
        return 'Auto mode - running automated extrusion'
    }
})

// Button handlers
async function handleExtrudeNextPosition() {
    try {
        await job.extrudeNextPosition()
    } catch (error) {
        console.error('Error during extrude next position:', error)
    }
}

async function handleContinueAutomatically() {
    try {
        await job.runAutomatedExtrusion(toast)
    } catch (error) {
        console.error('Error during automated extrusion:', error)
    }
}

function handleResetTimer() {
    try {
        job.resetExtrusionTiming()
        console.log('Extrusion timing has been reset')
    } catch (error) {
        console.error('Error resetting timer:', error)
    }
}

async function handleStartSemiAutoJob() {
    try {
        // Reset timer and position to ensure clean start (resets currentPlacementIndex to -1)
        job.resetExtrusionTiming()

        // Clear UI selection state
        job.lastNavigatedPlacementIndex = -1

        console.log('Starting semi-automatic job from first position')

        // Start at first position
        await job.extrudeNextPosition()
    } catch (error) {
        console.error('Error starting semi-automatic job:', error)
    }
}
</script>

<style scoped>
@import "tailwindcss" reference;
</style>
