const { login } = require('./login');
const Insumos = require("./insumos");
const Bodega = require("./bodega");


async function pedir_productos(url, token, sku_input, cantidad) {
    const requestData_productos = {
        sku: sku_input,
        quantity: cantidad
    };

    const requestOptions_productos = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData_productos)
    };
    //const response = await fetch(url + '/products', requestOptions_productos);
    try {
        // Envío de la solicitud
        let response = await fetch(url + '/products', requestOptions_productos);
        if (response.status === 401) {
            // Si el token no es válido, intenta obtener un nuevo token
            global.token = await login(global.apiUrl_desarrollo, global.token_desarrollo);
            // Actualiza el token en las opciones de solicitud
            requestOptions_productos.headers.Authorization = `Bearer ${global.token}`;
            // Reintentar la solicitud con el nuevo token
            response = await fetch(url + '/products', requestOptions_productos);
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

async function mover_producto_a_bodega(url, token, productId, store_input) {
    const requestData_productos = {
        store: store_input
    };

    const requestOptions_productos = {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData_productos)
    };
    //const response = await fetch(url + '/products'+`/${productId}`, requestOptions_productos);
    try {
        // Envío de la solicitud
        let response = await fetch(url + '/products'+`/${productId}`, requestOptions_productos);
        if (response.status === 401) {
            // Si el token no es válido, intenta obtener un nuevo token
            global.token = await login(global.apiUrl_desarrollo, global.token_desarrollo);
            // Actualiza el token en las opciones de solicitud
            requestOptions_productos.headers.Authorization = `Bearer ${global.token}`;
            // Reintentar la solicitud con el nuevo token
            response = await fetch(url + '/products'+`/${productId}`, requestOptions_productos);
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

async function obtener_productos_disponibles_en_mercado(url, token) {
    // Configuración de la solicitud
    const requestOptions_stores = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    let urlWithParams = `${url}/products/available`;
    
    try {
        // Envío de la solicitud
        const response = await fetch(urlWithParams, requestOptions_stores);
        if (!response.ok) {
            const error = new Error(`Error del servidor. Código de estado ${response.status}`);
            error.status = response.status;
            throw error;
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
    }
}

//-----------------------------------
async function crear_productos_intermedios(flag, url, token, sku) {
    if (!flag) {
        console.log("La funcion no debe ejecutarse aún");
        return;
    }

    console.log("HOLAAAAAA");

    const {productosIntermediosNecesarios} = Insumos.determinar_insumos()

    await crear_productos(url, token, sku, productosIntermediosNecesarios[sku].cantidad);

    // Identifica los productos de primer orden y segundo orden
    // const productos_primer_orden = [];
    // const productos_segungo_orden = [];

    // for (const producto in productosIntermediosNecesarios) {
    //     if (insumosNecesarios[producto].nivel === 'primer orden') {
    //         insumos_primer_orden.push({ sku: producto, ...productosIntermediosNecesarios[producto] });
    //     } else {
    //         insumos_segungo_orden.push({ sku: producto, ...productosIntermediosNecesarios[producto] });
    //     }
    // }

    // if (productos_primer_orden.length > 0) {
    //     for (const producto in productos_primer_orden) {
    //         await crear_productos(url, token, storeId, producto);
    //     }
    // }
    // else if (productos_segungo_orden.length > 0) {
    //     for (const producto in productos_segungo_orden){
    //         await crear_productos(url, token, storeId, producto);
    //         // crear_productos_segundo_orden(url, token, producto);
    //     }
    // }

    // Marcar como realizado
    // flag_productos.funcion_productos_intermedios_running = false;
    console.log("Función de productos intermedios completada.");

}

async function crear_productos (url, token, sku, cantidad) {

    const workshop_capacidad = 212;
    const Bodega = require("./bodega");
    // Sacar bach de las recetas
    const formulas = Insumos.leerFormulas('../files/recetas.txt');

    // const cantidad_productos = formulas[sku].loteCantidad;
    const insumosNecesarios = Object.keys(formulas[sku].insumos);
    // console.log(insumosNecesarios, "aaaaa")
    // Ids de las bodegas
    // const checkOut = obtener_id_bodega_especifica(url, token, 'checkOut');
    const workshop = await Bodega.obtener_id_bodega_especifica(url, token, 'Workshop');
    const buffer = await Bodega.obtener_id_bodega_especifica(url, token, 'buffer');
    // const workshop = '6612c8d005f75d27132bd631';
    // const buffer = '6612c8cf05f75d27132bd5e5';

    const bach = (formulas[sku].loteCantidad); // 18
    let contador_productos_producidos = 0
    let total_a_producir =  cantidad / formulas[sku].loteCantidad; // 97
    // console.log("total a prod", total_a_producir)
    flag_insumos_worshop = false;
    let cantidad_insumos = 0;
    let bach_a_producir = bach * 5;

    while (!flag_insumos_worshop) {
        // for (let num_producto = 0; num_producto < Math.ceil(cantidad / formulas[sku].loteCantidad); num_producto++) {

            flag_produccion_lista = false;
    
            // Mover los insumos y crear los productos
            for (const insumo in insumosNecesarios) {

                if (total_a_producir < 5) {
                    cantidad_insumos = formulas[sku].insumos[insumosNecesarios[insumo]] * total_a_producir;
                    bach_a_producir = bach * total_a_producir; // tengo que producir 5 veces 
                    total_a_producir = 0;
                } else {
                    // console.log(insumosNecesarios[insumo], insumo);
                    cantidad_insumos = formulas[sku].insumos[insumosNecesarios[insumo]] * 5; // Revisamos * 5 
                    // bach_a_producir = bach * 5; // tengo que producir 5 veces 
                    total_a_producir -= 5;
                }
                // console.log(formulas[sku].insumos[insumosNecesarios[insumo]]);
                // console.log( buffer, insumosNecesarios[insumo], cantidad_insumos);
                
                const datosInsumo = await Bodega.obtener_detalle_sku_en_bodega(url, token, buffer, insumosNecesarios[insumo], cantidad_insumos);
                await new Promise(resolve => setTimeout(resolve, 60000 / 90));
    
                const insumo_ids = datosInsumo.map(dato => dato._id);  // IDs de los insumos necesarios
                const bodegas =  await Bodega.obtener_bodegas(url, token)
                
                for (const id of insumo_ids) {
                    // revisar el espacio del workshop
                    // console.log(cantidad_insumos,workshop_capacidad , bodegas[4].usedSpace,"holaa")
                    if ( cantidad_insumos <= (workshop_capacidad - bodegas[4].usedSpace)) {
                        console.log(id, workshop, "id y workshop");
                        const semovio = await mover_producto_a_bodega(url, token, id, workshop);  // Mover al workshop
                        await new Promise(resolve => setTimeout(resolve, 60000 / 90));  // Esperar para no sobrecargar
                    }
                }
            }
            // console.log( sku, bach_a_producir, "sku y bach a producir")
            // Crear el producto final
            await pedir_productos(url, token, sku, bach_a_producir); // Producir el producto final
            contador_productos_producidos += bach_a_producir;

            // Si se terminaron de mandar producir no se reinia el while inicial
            if (total_a_producir == 0 ) {
                flag_insumos_worshop = true;
            }
        
            // while para revisar bodega 
            // const stockActual = await Insumos.revisar_bodega(url, token);
            while (!flag_produccion_lista) {
                const stockActual = await Insumos.revisar_bodega(url, token);
                // const productos_producidos = stockActual.get(sku, 0);
                let productos_producidos = 0;
                if (stockActual[sku]) {
                    productos_producidos = stockActual[sku];
                }
    
                if (productos_producidos >= contador_productos_producidos) {
                    flag_produccion_lista = true;
                } else {
                    await new Promise(resolve => setTimeout(resolve, 60000 / 90));
                }
            }

            // Esto tiene que ser arreglado
            const detalle_sku = await Bodega.obtener_detalle_sku_en_bodega(url, token, workshop, sku , bach_a_producir);
            await new Promise(resolve => setTimeout(resolve, 60000 / 90));
            
            if (!detalle_sku) {
                console.log(`No se pudo obtener información para SKU: ${sku}`);
                return;
            }
    
            const sku_ids = detalle_sku.map(p => p._id);
    
            // Mover al buffer si la producción está lista
            if (flag_produccion_lista) {
                for (const id of sku_ids.slice(0, cantidad)) {
                    try {
                        await mover_producto_a_bodega(url, token, id, buffer);  // Mover al buffer
                        await new Promise(resolve => setTimeout(resolve, 60000 / 90));  // Esperar
                    } catch (error) {
                        console.error(`Error al mover producto ${id} al buffer:`, error);
                    }
                }
            }
    
            console.log(`Producción y movimiento para el SKU ${sku} completados.`);   
        // }   
    }

    console.log(`Se completaron las ${numIteraciones} iteraciones para el SKU ${sku}.`);
}

module.exports = {
    pedir_productos,
    mover_producto_a_bodega,
    obtener_productos_disponibles_en_mercado,
    crear_productos,
    crear_productos_intermedios
};