export class User {
    constructor(username) {
        if (!User.apiUrl) { throw new Error("User.apiUrl must be set") };
        this.username = username
        this.basket = []
        this.permissions = []
    }

    async loadBasket() {
        await this.getBasketRecords()
    }

    async getBasketRecords() {
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