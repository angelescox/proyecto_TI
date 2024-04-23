const Producto = require("./producto");
const { login } = require('./login');
async function obtener_bodegas(url, token) {
    // Configuración de la solicitud
    const requestOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    try {
        // Envío de la solicitud
        let response = await fetch(url + '/stores', requestOptions);
        if (response.status === 401) {
            // Si el token no es válido, intenta obtener un nuevo token
            global.token = await login(global.apiUrl_desarrollo, global.token_desarrollo);
            // Actualiza el token en las opciones de solicitud
            requestOptions.headers.Authorization = `Bearer ${global.token}`;
            // Reintentar la solicitud con el nuevo token
            response = await fetch(url + '/stores', requestOptions);
        }
        if (!response.ok) {
            const error = new Error(`Error del servidor. Código de estado ${response.status}`);
            error.status = response.status;
            throw error;
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        return error
    }
}
async function obtener_productos_en_bodega(url, token, storeId) {
    // Configuración de la solicitud
    const requestOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    const urlWithParams = `${url}/stores/${storeId}/inventory`;
    
    try {
        // Envío de la solicitud
        let response = await fetch(urlWithParams, requestOptions);
        if (response.status === 401) {
            // Si el token no es válido, intenta obtener un nuevo token
            global.token = await login(global.apiUrl_desarrollo, global.token_desarrollo);
            // Actualiza el token en las opciones de solicitud
            requestOptions.headers.Authorization = `Bearer ${global.token}`;
            // Reintentar la solicitud con el nuevo token
            response = await fetch(urlWithParams, requestOptions);
        }
        if (!response.ok) {
            const error = new Error(`Error del servidor. Código de estado ${response.status}`);
            error.status = response.status;
            throw error;
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        return error
    }
}

async function obtener_detalle_sku_en_bodega(url, token, storeId, sku, limit) {
    // Configuración de la solicitud
    const requestOptions= {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    let urlWithParams = `${url}/stores/${storeId}/products?sku=${sku}`;
    if (limit!=undefined) {
        urlWithParams+=`&limit=${limit}`;
    }
    else{
        urlWithParams+=`&limit=199`;
    }
    try {
        // Envío de la solicitud
        let response = await fetch(urlWithParams, requestOptions);
        if (response.status === 401) {
            // Si el token no es válido, intenta obtener un nuevo token
            global.token = await login(global.apiUrl_desarrollo, global.token_desarrollo);
            // Actualiza el token en las opciones de solicitud
            requestOptions.headers.Authorization = `Bearer ${global.token}`;
            // Reintentar la solicitud con el nuevo token
            response = await fetch(urlWithParams, requestOptions);
        }
        if (!response.ok) {
            const error = new Error(`Error del servidor. Código de estado ${response.status}`);
            error.status = response.status;
            throw error;
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        return error
    }
}

//Mueve el primer producto de SKU enviado que encuentre en cualquier bodega menos la de destino, a la bodega de destino que le entregues
async function mover_sku_a_bodega(url, token, sku, bodegaDestino) {
    try {
        // Obtener la lista de todas las bodegas
        const bodegas = await obtener_bodegas(url, token);
        // Iterar sobre cada bodega (excepto la de destino)
        for (const bodega of bodegas) {
            if (bodega._id !== bodegaDestino) {
                // Verificar si el SKU está disponible en esta bodega
                const productosEnBodega = await obtener_productos_en_bodega(url, token, bodega._id);
                const producto = productosEnBodega.find(producto => producto.sku === sku);
                // console.log(producto.store, "stoore")
                // Verificar si se encontró el producto antes de continuar
                if (producto) {
                    // console.log(producto, "cantidad de producto y donde");
                    const productoDetallado = await obtener_detalle_sku_en_bodega(url, token, producto.store, sku, 1);
                    // Agregar un retardo para cumplir con el límite de solicitudes
                    await new Promise(resolve => setTimeout(resolve, 60000 / 90)); // 90 solicitudes por minuto
                    // console.log(productoDetallado, "prod detallado")
                    // Verificar si se encontró el detalle del producto antes de continuar
                    if (productoDetallado) {
                        // Mover el SKU a la bodega de destino
                        const semovio= await Producto.mover_producto_a_bodega(url, token, productoDetallado[0]._id, bodegaDestino);
                        // console.log("llega?", semovio);
                        console.log(`SKU ${sku} movido a la bodega ${bodegaDestino} exitosamente.`);
                        // Agregar un retardo para cumplir con el límite de solicitudes
                        await new Promise(resolve => setTimeout(resolve, 60000 / 90)); // 90 solicitudes por minuto
                        // Salir del bucle una vez que se haya movido el producto, sino se mueve uno de cada bodega que lo tenga
                        break;
                    } else {
                        console.log(`No se pudo obtener el detalle del producto en la bodega ${producto.store}`);
                    }
                } else {
                    console.log(`No se encontró el producto SKU ${sku} en la bodega ${bodega._id}`);
                }
            }
        }

        // console.log(`SKU ${sku} movido a la bodega ${bodegaDestino} exitosamente.`);
    } catch (error) {
        console.error('Error al mover SKU:', error);
    }
}
async function obtener_id_bodega_especifica(url, token, nombre_bodega) {
    try {
        const bodegas = await obtener_bodegas(url, token);
        const bodegaWorkshop = bodegas.find(bodega => bodega.workshop === true);
        const bodegabuffer = bodegas.find(bodega => bodega.buffer === true);
        const bodegacheckIn = bodegas.find(bodega => bodega.checkIn === true);
        const bodegacheckOut = bodegas.find(bodega => bodega.checkOut === true);
        if (nombre_bodega == 'Workshop') {
            const idWorkshop = bodegaWorkshop._id; 
            //console.log("El _id de la bodega con workshop es:", idWorkshop);
            return idWorkshop;
        }
        if (nombre_bodega == 'buffer') {
            const idbuffer = bodegabuffer._id; 
            //console.log("El _id de la bodega con buffer es:", idbuffer);
            return idbuffer;
        }
        if (nombre_bodega == 'checkIn') {
            const idcheckIn = bodegacheckIn._id; 
            //console.log("El _id de la bodega con checkin es:", idcheckIn);
            return idcheckIn;
        }
        if (nombre_bodega == 'checkOut') {
            const idcheckOut = bodegacheckOut._id; 
            //console.log("El _id de la bodega con checkOut es:", idcheckOut);
            return idcheckOut;
        }
        
            console.log("No se encontró ninguna bodega con workshop.");
            return null;
        
    } catch (error) {
        console.error('Error:', error);
        return null; 
    }
}


module.exports = {
    obtener_bodegas,
    obtener_productos_en_bodega,
    obtener_detalle_sku_en_bodega,
    mover_sku_a_bodega,
    obtener_id_bodega_especifica
};




