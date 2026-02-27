import { describe, test, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHashHistory } from 'vue-router'
import { nextTick } from 'vue'
import SetupView from '../SetupView.vue'
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
        // Score is 0-0, so Team 1 (Alice) is server.
        // Team1 on Right side -> server must be @ Top.
        // Team2 on Left side -> receiver (Carol) must be @ Bottom.
        const tl = wrapper.find('.doubles-tl')
        const bl = wrapper.find('.doubles-bl')
        const tr = wrapper.find('.doubles-tr')
        const br = wrapper.find('.doubles-br')

        expect(tl.text()).toContain('Dave')
        expect(bl.text()).toContain('Carol')
        expect(tr.text()).toContain('Alice')
        expect(br.text()).toContain('Bob')
    })

    test('Swap Players left button swaps TL and BL player names', async () => {
        const { wrapper, store } = mountComponent(doublesMatch)
        store.swappedSides = false
        await nextTick()

        // Initial 0-0: Alice is server @ Bottom-Left, Bob is partner @ Top-Left.
        expect(wrapper.find('.doubles-tl').text()).toContain('Bob')
        expect(wrapper.find('.doubles-bl').text()).toContain('Alice')

        // Click the left swap button -> Changes server to Bob.
        // Bob becomes server @ Bottom-Left. Alice moves to Top-Left.
        await wrapper.find('.swap-left-btn').trigger('click')
        await nextTick()

        // After: TL = Alice (p1Top=0), BL = Bob (p1Bot=1)
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

        // Click the right swap button -> Changes receiver to Dave.
        // Dave becomes receiver @ Top-Right. Carol moves to Bottom-Right.
        await wrapper.find('.swap-right-btn').trigger('click')
        await nextTick()

        // After: TR = Dave (p2Top=1), BR = Carol (p2Bot=0)
        expect(wrapper.find('.doubles-tr').text()).toContain('Dave')
        expect(wrapper.find('.doubles-br').text()).toContain('Carol')
    })



    test('between-game modal renders when doublesNextServingTeam is set', async () => {
        const { wrapper, store } = mountComponent(doublesMatch)
        await nextTick()

        // Initially no modal
        expect(wrapper.find('#doubles-server-choice-modal').exists()).toBe(false)

        // Simulate post-nextGame(): set doublesNextServingTeam to team 1
        store.doublesNextServingTeam = 1
        await nextTick()

        // Modal should now appear
        const modal = wrapper.find('#doubles-server-choice-modal')
        expect(modal.exists()).toBe(true)

        // Should show team1 players (Alice and Bob)
        expect(modal.text()).toContain('Alice')
        expect(modal.text()).toContain('Bob')
    })

    test('choosing a player in between-game modal calls setDoublesServerForNewGame and clears doublesNextServingTeam', async () => {
        const { wrapper, store } = mountComponent(doublesMatch)
        await nextTick()

        // Set up state as if nextGame() had been called
        store.doublesNextServingTeam = 2
        store.prevDoublesInitialServer = { team: 1, player: 0 }
        store.prevDoublesInitialReceiver = { team: 2, player: 0 }
        await nextTick()

        // Modal should be visible with team2 players (Carol and Dave)
        const modal = wrapper.find('#doubles-server-choice-modal')
        expect(modal.exists()).toBe(true)

        // Click the button for team2[0] (Carol) — player index 0
        const buttons = modal.findAll('button')
        const carolBtn = buttons.find(b => b.text() === 'Carol')
        expect(carolBtn).toBeDefined()
        await carolBtn.trigger('click')
        await nextTick()

        // doublesNextServingTeam should be cleared (modal closes)
        expect(store.doublesNextServingTeam).toBeNull()

        // doublesInitialServer should be updated to team 2, player 0 (Carol)
        expect(store.doublesInitialServer.team).toBe(2)
        expect(store.doublesInitialServer.player).toBe(0)
    })
})
