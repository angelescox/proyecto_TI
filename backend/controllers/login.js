require("../index");



async function login(url, token_desarrollo) {
    const requestData_auth = {
        group: 15,
        secret: global.token_desarrollo
    };

    const requestOptions_auth = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData_auth)
    };

    try {
        const response = await fetch(url + '/auth', requestOptions_auth);
        if (!response.ok) {
            const error = new Error(`Error del servidor. Código de estado ${response.status}`);
            error.status = response.status;
            throw error;
        }
        const data = await response.json();
        //console.log("Token recibido: ", data.token);
        return data.token;
    } catch (error) {
        console.error(error);
        return null; // O manejar el error de una manera que prefieras
    }
}



module.exports = {
    login
  };



