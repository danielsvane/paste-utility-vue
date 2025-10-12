<template>
  <Card title="Machine Controls">
    <div class="space-y-6">
      <!-- Control Buttons -->
      <div class="flex gap-3 flex-wrap">
        <Button text="Pressurize" @click="job.pressurize()" />
        <Button text="Depressurize" @click="job.depressurize()" />
      </div>

      <div class="flex gap-3 flex-wrap">
        <Button text="Extrude" @click="job.extrude()" />
        <Button text="Start Slow Extrude" @click="job.startSlowExtrude()" />
        <Button text="Stop Extrude" @click="job.stopExtrude()" />
        <Button text="Retract & Raise" @click="job.retractAndRaise()" />
      </div>

      <div class="flex gap-3 flex-wrap">
        <Button text="Extrude Next Position" />
        <Button :disabled="true" text="Continue Automatically" />
        <Button text="Reset Timer" />
      </div>

      <div class="text-center text-goldenrod text-sm p-2 bg-gray-700 rounded">
        Manual mode - learning extrusion times
      </div>

      <!-- Homing Controls -->
      <div class="flex gap-3">
        <Button @click="serial.send('G28')" type="secondary" text="Home All" />
        <Button @click="serial.send('G28 X')" type="secondary" text="Home X" />
        <Button @click="serial.send('G28 Y')" type="secondary" text="Home Y" />
        <Button @click="serial.send('G28 Z')" type="secondary" text="Home Z" />
      </div>

      <!-- Light and Air Controls -->
      <div class="flex gap-3 flex-wrap">
        <Button type="secondary" text="Ring Lights On" />
        <Button type="secondary" text="Ring Lights Off" />
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
import Button from './Button.vue'
import Card from './Card.vue'
import { useSerialStore } from '../stores/serial'
import { useControlsStore } from '../stores/controls'
import { useJobStore } from '../stores/job'

const serial = useSerialStore()
const controls = useControlsStore()
const job = useJobStore()
</script>

<style scoped>
@import "tailwindcss" reference;
</style>
