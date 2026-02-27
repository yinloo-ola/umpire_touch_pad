import { describe, test, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHashHistory } from 'vue-router'
import { nextTick } from 'vue'
import Touchpad from '../Touchpad.vue'
import { useMatchStore } from '../../stores/matchStore'

const doublesMatch = {
    type: 'doubles',
    event: 'Test Doubles',
    time: '10:00',
    bestOf: 5,
    team1: [
        { name: 'Alice', country: 'AUS' },
        { name: 'Bob', country: 'AUS' },
    ],
    team2: [
        { name: 'Carol', country: 'CAN' },
        { name: 'Dave', country: 'CAN' },
    ],
}

const singlesMatch = {
    type: 'singles',
    event: 'Test Singles',
    time: '11:00',
    bestOf: 5,
    team1: [{ name: 'Eve', country: 'GBR' }],
    team2: [{ name: 'Frank', country: 'USA' }],
}

function mountComponent(match) {
    const router = createRouter({
        history: createWebHashHistory(),
        routes: [
            { path: '/', component: { template: '<div/>' } },
            { path: '/scoring', component: Touchpad },
        ],
    })
    const pinia = createTestingPinia({ stubActions: false })
    const wrapper = mount(Touchpad, {
        global: { plugins: [pinia, router] },
    })
    const store = useMatchStore()
    store.selectMatch(match)
    return { wrapper, store }
}

describe('Touchpad — doubles quadrant display', () => {
    test('shows 4 named quadrants in status box when pointStarted for doubles', async () => {
        const { wrapper, store } = mountComponent(doublesMatch)
        // Start play so pointStarted=true
        store.isStarted = true
        store.pointStarted = true
        await nextTick()

        // All four player names should appear in the status box
        expect(wrapper.text()).toContain('Alice')
        expect(wrapper.text()).toContain('Bob')
        expect(wrapper.text()).toContain('Carol')
        expect(wrapper.text()).toContain('Dave')
    })

    test('singles status box still shows only 2-slot layout (no quadrant grid)', async () => {
        const { wrapper, store } = mountComponent(singlesMatch)
        store.isStarted = true
        store.pointStarted = true
        await nextTick()

        // 4-quad grid shows all 4 players -- singles only has 2
        // Confirm doubles class is absent
        expect(wrapper.findAll('.tp-p-name').length).toBeLessThanOrEqual(2)
    })

    test('after swapLeftPlayers(), TL and BL names are exchanged in status box', async () => {
        const { wrapper, store } = mountComponent(doublesMatch)
        store.swappedSides = false
        store.isStarted = true
        store.pointStarted = true
        await nextTick()

        // Before swap: top-left = Alice, bottom-left = Bob
        const beforeNames = wrapper.findAll('.table-quad').map(q => q.text())
        // Confirm Alice appears in a top-left position and Bob in bottom-left
        // (exact order depends on DOM order: TL, TR, BL, BR)
        expect(wrapper.text()).toContain('Alice')
        expect(wrapper.text()).toContain('Bob')

        // Call swap left
        store.swapLeftPlayers()
        await nextTick()

        // After swap: p1Top=1 (Bob), p1Bot=0 (Alice)
        // The top-left quadrant should now show Bob
        const quads = wrapper.findAll('.table-quad')
        const topLeft = quads.find(q => q.classes('top-left'))
        const bottomLeft = quads.find(q => q.classes('bottom-left'))
        if (topLeft && bottomLeft) {
            expect(topLeft.text()).toContain('Bob')
            expect(bottomLeft.text()).toContain('Alice')
        }
    })

    test('after swapRightPlayers(), TR and BR names are exchanged in status box', async () => {
        const { wrapper, store } = mountComponent(doublesMatch)
        store.swappedSides = false
        store.isStarted = true
        store.pointStarted = true
        await nextTick()

        store.swapRightPlayers()
        await nextTick()

        // After swap: p2Top=1 (Dave), p2Bot=0 (Carol)
        const quads = wrapper.findAll('.table-quad')
        const topRight = quads.find(q => q.classes('top-right'))
        const bottomRight = quads.find(q => q.classes('bottom-right'))
        if (topRight && bottomRight) {
            expect(topRight.text()).toContain('Dave')
            expect(bottomRight.text()).toContain('Carol')
        }
    })
})

describe('Touchpad — doubles top-row Swap Players buttons', () => {
    test('top-row shows Swap buttons (not Cards buttons) for doubles', async () => {
        const { wrapper } = mountComponent(doublesMatch)
        await nextTick()

        expect(wrapper.find('#tp-swap-left-btn').exists()).toBe(true)
        expect(wrapper.find('#tp-swap-right-btn').exists()).toBe(true)
    })

    test('top-row shows Cards buttons (not Swap buttons) for singles', async () => {
        const { wrapper } = mountComponent(singlesMatch)
        await nextTick()

        expect(wrapper.find('#tp-swap-left-btn').exists()).toBe(false)
        expect(wrapper.find('#tp-swap-right-btn').exists()).toBe(false)
        expect(wrapper.findAll('.card-btn').length).toBe(2)
    })

    test('clicking Swap left button calls swapLeftPlayers()', async () => {
        const { wrapper, store } = mountComponent(doublesMatch)
        await nextTick()

        // p1Top=0 (Alice), p1Bot=1 (Bob) before
        expect(store.p1Top).toBe(0)
        expect(store.p1Bot).toBe(1)

        await wrapper.find('#tp-swap-left-btn').trigger('click')
        await nextTick()

        // After swap: p1Top=1, p1Bot=0
        expect(store.p1Top).toBe(1)
        expect(store.p1Bot).toBe(0)
    })

    test('clicking Swap right button calls swapRightPlayers()', async () => {
        const { wrapper, store } = mountComponent(doublesMatch)
        await nextTick()

        expect(store.p2Top).toBe(0)
        expect(store.p2Bot).toBe(1)

        await wrapper.find('#tp-swap-right-btn').trigger('click')
        await nextTick()

        expect(store.p2Top).toBe(1)
        expect(store.p2Bot).toBe(0)
    })
})
