<template>
  <Card title="Misc Controls">
    <div class="space-y-6">
      <!-- Light and Air Controls -->
      <div class="flex gap-3 flex-wrap">
        <Button type="secondary" text="Ring Lights On" @click="controls.ringLightsOn" />
        <Button type="secondary" text="Ring Lights Off" @click="controls.ringLightsOff" />
      </div>

      <div class="flex gap-3 flex-wrap">
        <Button type="secondary" text="Left Air On" />
        <Button type="secondary" text="Left Air Off" />
        <Button type="secondary" text="Left Vac" />
      </div>

      <div>
        <Button type="secondary" text="Disable Steppers" />
      </div>
    </div>
  </Card>
</template>

<script setup>
import { useControlsStore } from '../stores/controls'
import { useJobStore } from '../stores/job'
import { useSerialStore } from '../stores/serial'
import Button from './Button.vue'
import Card from './Card.vue'

const serial = useSerialStore()
const controls = useControlsStore()
const job = useJobStore()
</script>

<style scoped>
@import "tailwindcss" reference;
</style>
