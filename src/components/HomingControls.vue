<template>
    <Card title="Homing Controls">
        <div class="flex gap-3">
            <Button @click="serial.send('G28')" type="secondary" text="Home All" />
            <Button @click="serial.send('G28 X')" type="secondary" text="Home X" />
            <Button @click="serial.send('G28 Y')" type="secondary" text="Home Y" />
            <Button @click="serial.send('G28 Z')" type="secondary" text="Home Z" />
        </div>
    </Card>
</template>

<script setup>
import { useSerialStore } from '../stores/serial'
import Button from './Button.vue'
import Card from './Card.vue'

const serial = useSerialStore()
</script>

<style scoped>
@import "tailwindcss" reference;
</style>
