import { describe, test, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHashHistory } from 'vue-router'
import { nextTick } from 'vue'
import SetupView from '../../views/umpire/SetupView.vue'
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
            { path: '/setup', component: SetupView },
        ],
    })
    const pinia = createTestingPinia({ stubActions: false })
    const wrapper = mount(SetupView, {
        global: { plugins: [pinia, router] },
    })
    const store = useMatchStore()
    store.selectMatch(match)
    return { wrapper, store }
}

describe('SetupView — doubles layout', () => {
    test('renders 4 player quadrant cards for a doubles match', async () => {
        const { wrapper } = mountComponent(doublesMatch)
        await nextTick()
        // All four player names should appear somewhere in the component
        expect(wrapper.text()).toContain('Alice')
        expect(wrapper.text()).toContain('Bob')
        expect(wrapper.text()).toContain('Carol')
        expect(wrapper.text()).toContain('Dave')
    })

    test('does NOT render doubles quadrant grid for a singles match', async () => {
        const { wrapper } = mountComponent(singlesMatch)
        await nextTick()
        // Should not have the doubles grid
        expect(wrapper.find('.doubles-court-grid').exists()).toBe(false)
        // Should have the singles grid
        expect(wrapper.find('.court-grid').exists()).toBe(true)
    })

    test('p-label badges reflect swappedSides=false: left=P1/P1D, right=P2/P2D', async () => {
        const { wrapper, store } = mountComponent(doublesMatch)
        store.swappedSides = false
        await nextTick()

        const labels = wrapper.findAll('.p-label').map(el => el.text())
        expect(labels).toContain('P1')
        expect(labels).toContain('P1D')
        expect(labels).toContain('P2')
        expect(labels).toContain('P2D')
    })

    test('after toggleSwapSides(), left side shows team2 players and right shows team1', async () => {
        const { wrapper, store } = mountComponent(doublesMatch)
        await nextTick()

        store.toggleSwapSides()
        await nextTick()

        // After side swap: left = team2, right = team1.
        // Under new UI-decoupled setup rules, players walk straight across the table.
        // Before swap: TL=Bob, BL=Alice, TR=Carol, BR=Dave.
        // After swap:  TL=Carol, BL=Dave, TR=Bob, BR=Alice.
        const tl = wrapper.find('.doubles-tl')
        const bl = wrapper.find('.doubles-bl')
        const tr = wrapper.find('.doubles-tr')
        const br = wrapper.find('.doubles-br')

        expect(tl.text()).toContain('Carol')
        expect(bl.text()).toContain('Dave')
        expect(tr.text()).toContain('Bob')
        expect(br.text()).toContain('Alice')
    })

    test('Swap Players left button swaps TL and BL player names', async () => {
        const { wrapper, store } = mountComponent(doublesMatch)
        store.swappedSides = false
        await nextTick()

        // Initial 0-0: Alice is server @ Bottom-Left, Bob is partner @ Top-Left.
        expect(wrapper.find('.doubles-tl').text()).toContain('Bob')
        expect(wrapper.find('.doubles-bl').text()).toContain('Alice')

        // Click the left swap button -> Swaps visual Top/Bottom and re-calibrates logic
        await wrapper.find('.swap-left-btn').trigger('click')
        await nextTick()

        // After: TL = Alice, BL = Bob
        expect(wrapper.find('.doubles-tl').text()).toContain('Alice')
        expect(wrapper.find('.doubles-bl').text()).toContain('Bob')
    })

    test('Swap Players right button swaps TR and BR player names', async () => {
        const { wrapper, store } = mountComponent(doublesMatch)
        store.swappedSides = false
        await nextTick()

        // Initial 0-0: Carol is receiver @ Top-Right, Dave is partner @ Bottom-Right.
        expect(wrapper.find('.doubles-tr').text()).toContain('Carol')
        expect(wrapper.find('.doubles-br').text()).toContain('Dave')

        // Click the right swap button -> Swaps visual Top/Bottom and re-calibrates logic
        await wrapper.find('.swap-right-btn').trigger('click')
        await nextTick()

        // After: TR = Dave, BR = Carol
        expect(wrapper.find('.doubles-tr').text()).toContain('Dave')
        expect(wrapper.find('.doubles-br').text()).toContain('Carol')
    })



})
