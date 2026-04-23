export class User {
    constructor(username) {
        if (!User.apiUrl) { throw new Error("User.apiUrl must be set") };
        this.username = username
        this.basket = []
        this.permissions = []
    }

    isAuthenticated() {
        const username = String(this.username || '').trim().toLowerCase()
        const invalidUsernames = new Set([
            '',
            'none',
            'null',
            'anonymous',
            'anonymoususer',
            'anonymoususermixin'
        ])

        if (!invalidUsernames.has(username)) {
            return true
        }

        const token = String(this.getAuthToken() || '').trim()
        if (token.length > 0) {
            return true
        }

        return Array.isArray(this.permissions) && this.permissions.length > 0
    }

    async loadBasket() {
        if (!this.isAuthenticated()) {
            this.basket = []
            return
        }
        await this.getBasketRecords()
    }

    normalizeCollection(collection) {
        const mapped = {
            speeches: 'bibs',
            votes: 'bibs'
        }
        return mapped[String(collection || '').toLowerCase()] || collection
    }

    isInBasket(collection, recordId) {
        const normalizedCollection = this.normalizeCollection(collection)
        return this.basket.some(item =>
            String(item.collection) === String(normalizedCollection)
            && String(item.record_id) === String(recordId)
        )
    }

    async getRecordLockStatus(collection, recordId) {
        const normalizedCollection = this.normalizeCollection(collection)
        const response = await fetch(`${User.apiUrl}/marc/${normalizedCollection}/records/${recordId}/locked`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            }
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch lock status: ${response.status} ${response.statusText}`)
        }

        return response.json()
    }

    async addBasketItem(collection, recordId, { override = false } = {}) {
        const normalizedCollection = this.normalizeCollection(collection)
        const response = await fetch(`${User.apiUrl}/userprofile/my_profile/basket`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify({
                collection: normalizedCollection,
                record_id: String(recordId),
                title: '[No Title]',
                override
            })
        })

        if (!response.ok) {
            throw new Error(`Failed to add record to basket: ${response.status} ${response.statusText}`)
        }

        return true
    }

    async clearBasket() {
        const response = await fetch(`${User.apiUrl}/userprofile/my_profile/basket/clear`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            }
        })

        if (!response.ok) {
            throw new Error(`Failed to clear basket: ${response.status} ${response.statusText}`)
        }

        return true
    }

    async removeBasketItemByUrl(itemUrl) {
        if (!itemUrl) {
            throw new Error('Basket item URL is required')
        }

        const absolute = itemUrl.startsWith('http')
            ? itemUrl
            : `${window.location.origin}${itemUrl}`

        const response = await fetch(absolute, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`
            }
        })

        if (!response.ok) {
            throw new Error(`Failed to remove basket item: ${response.status} ${response.statusText}`)
        }

        return true
    }

    async getBasketRecords() {
        if (!this.isAuthenticated()) {
            this.basket = []
            return
        }

        try {
            const response = await fetch(`${User.apiUrl}/userprofile/my_profile/basket`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            })

            if (!response.ok) {
                throw new Error(`Failed to fetch basket: ${response.statusText}`)
            }

            const data = await response.json()

            // Extract item data from the response
            if (data.data && data.data.item_data) {
                this.basket = data.data.item_data
            }
        } catch (error) {
            console.error('Error fetching basket records:', error)
            this.basket = []
        }
    }

    async loadUserProfile() {
        if (!this.isAuthenticated()) {
            this.permissions = []
            return
        }

        try {
            const response = await fetch(`${User.apiUrl}/userprofile/my_profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            })

            if (!response.ok) {
                throw new Error(`Failed to fetch user profile: ${response.statusText}`)
            }

            const data = await response.json()

            // Extract permissions from the response
            if (data.data && data.data.permissions) {
                this.permissions = data.data.permissions
            }
        } catch (error) {
            console.error('Error fetching user profile:', error)
            this.permissions = []
        }
    }

    hasPermission(action) {
        return this.permissions.includes(action)
    }

    getAuthToken() {
        // Retrieve auth token from localStorage or session
        return localStorage.getItem('authToken') || ''
    }
}