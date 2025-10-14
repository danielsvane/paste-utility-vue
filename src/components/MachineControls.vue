<template>
  <Card title="Machine Controls">
    <div class="space-y-6">
      <!-- Control Buttons -->
      <div class="flex gap-3 flex-wrap">
        <Button text="Extrude" @click="job.extrude()" />
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
