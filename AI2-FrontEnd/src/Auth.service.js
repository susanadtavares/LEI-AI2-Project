import axios from 'axios';

class Authentication {
    async login(email, password) {
        
        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/login`, {
                email,
                password 
            });

            


            if (response.data.success) {
                localStorage.setItem('token', JSON.stringify(response.data.token));
                localStorage.setItem('refreshToken', JSON.stringify(response.data.refreshToken));
                return response.data;
            } else {
                window.location.href = '/signup';
                
            }
        } catch (error) {
            console.log(error);
            if(error.response.data.success == false){
                console.log("AA");
                localStorage.setItem('tempReset', JSON.stringify(error.response.data.redirect));
                window.location.href = '/reset-password';
            }
            return error.response.data;
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/';
    }

    async getCurrentUser(page = null) {
        const tokenString = localStorage.getItem('token');
    
        if (!tokenString) {
            if (page === "login") {
                return null;
            }
            window.location.href = '/login';
            return null;
        }
    
        const tokenObject = JSON.parse(tokenString);  // Parse the JSON string into an object
    
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/auth/get-user-by-token`, {
                headers: {
                    Authorization: `Bearer ${JSON.stringify(tokenObject)}`, // Send the entire token object as a JSON string
                },
            });
    
            if (response.data.success) {
                return {
                    user: response.data.user,
                    token: tokenObject,
                 } // Return user data
            } else {
                this.logout();
                return null;
            }
        } catch (error) {
            console.log(error);
            this.logout();
            return null;
        }
    }
}

export default new Authentication();