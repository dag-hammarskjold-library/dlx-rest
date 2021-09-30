export default {
    async getProfile(api_prefix, profile_id='my_profile') {
        let myProfileUrl = `${api_prefix}userprofile/${profile_id}`;
        let response = await fetch(myProfileUrl);
        if (response.redirected) {
            return null;
        } else if (response.ok) {
            let jsonData = await response.json();
            return jsonData;
        }
    }
}