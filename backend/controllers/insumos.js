const fs = require('fs');
const { pedir_productos, mover_producto_a_bodega } = require('./producto');
const { obtener_id_bodega_especifica, obtener_detalle_sku_en_bodega } = require('./bodega');
const { obtener_productos_en_bodega } = require('./bodega');
const { login } = require('./login');
const { Console } = require('console');
const Bodega = require("./bodega");




function leerOrdenes(filePath) {
    const contenido = fs.readFileSync(require.resolve(filePath), 'utf8');
    const lineas = contenido.split('\n');
    const ordenes = {};
    lineas.forEach(linea => {
        const [producto, cantidad] = linea.trim().split(' ');
        if (producto && cantidad) {
            ordenes[producto] = parseInt(cantidad, 10);
        }
    });
    return ordenes;
}

function leerFormulas(filePath) {
    const contenido = fs.readFileSync(require.resolve(filePath), 'utf8');
    const lineas = contenido.split('\n');
    const formulas = {};
    lineas.forEach(linea => {
        //console.log("LINEA: ", linea);
        const partes = linea.split(':');
        //console.log("LINEA: ", linea);
        if (partes.length < 2) {
            console.error('Formato de línea incorrecto:', linea);
            // Saltar esta iteración del bucle si estás dentro de uno
        }
        //console.log("PARTES: ", partes);
        const producto = partes[0].trim();
        const [nombreProducto, loteSize] = producto.split(' ');
        const loteCantidad = parseInt(loteSize, 10);
        const insumos = partes[1].split(',').reduce((acc, insumo) => {
            const [nombre, cantidad] = insumo.trim().split(' ');
            acc[nombre] = Number(cantidad);
            return acc;
        }, {});
        formulas[nombreProducto] = { loteCantidad, insumos };
    });
    return formulas;
}


/*
function calcularInsumosNecesarios(formulas, producto, cantidadPedido, acumulador = {}) {
    const formula = formulas[producto];
    if (!formula) return; // Si no hay fórmula para el producto, no hacemos nada

    const { loteCantidad, insumos } = formula;
    const numLotes = Math.ceil(cantidadPedido / loteCantidad); // Redondear hacia arriba para cubrir toda la cantidad pedida

    for (const insumo in insumos) {
        const totalInsumo = insumos[insumo] * numLotes;
        if (formulas[insumo]) { // Si el insumo es en realidad un subproducto con su propia fórmula
            calcularInsumosNecesarios(formulas, insumo, totalInsumo, acumulador);
        } else {
            if (!acumulador[insumo]) {
                acumulador[insumo] = 0;
            }
            acumulador[insumo] += totalInsumo;
        }
    }
    return acumulador;
}
*/
/*
function calcularInsumos(formulas, producto, cantidadPedido, acumuladorInsumos, acumuladorProductos, ordenes) {
    const formula = formulas[producto];
    if (!formula) return;  // Si no hay fórmula para el producto, no hacemos nada

    const { loteCantidad, insumos } = formula;
    const numLotes = Math.ceil(cantidadPedido / loteCantidad); // Calcular los lotes necesarios

    // Registrar la producción necesaria de este producto intermedio si no es un producto final
    if (!ordenes[producto]) {  // Verifica si el producto no está directamente en las órdenes
        acumuladorProductos[producto] = (acumuladorProductos[producto] || 0) + numLotes * loteCantidad;
    }

    for (const insumo in insumos) {
        const totalInsumo = insumos[insumo] * numLotes;
        if (formulas[insumo]) { // Si el insumo es en realidad un subproducto con su propia fórmula
            calcularInsumos(formulas, insumo, totalInsumo, acumuladorInsumos, acumuladorProductos, ordenes);
        } else {
            acumuladorInsumos[insumo] = (acumuladorInsumos[insumo] || 0) + totalInsumo; // Asegurar la acumulación correcta
        }
    }
}
*/

function calcularInsumos(formulas, producto, cantidadPedido, acumuladorInsumos, acumuladorProductos, ordenes, nivelProductos) {
    const formula = formulas[producto];
    if (!formula) return;  // Si no hay fórmula para el producto, no hacemos nada

    const { loteCantidad, insumos } = formula;
    const numLotes = Math.ceil(cantidadPedido / loteCantidad); // Calcular los lotes necesarios

    let esSegundoOrden = false;

    for (const insumo in insumos) {
        const totalInsumo = insumos[insumo] * numLotes;
        if (formulas[insumo]) { // Si el insumo es en realidad un subproducto con su propia fórmula
            esSegundoOrden = true;  // Esto indica que depende de otro producto intermedio
            calcularInsumos(formulas, insumo, totalInsumo, acumuladorInsumos, acumuladorProductos, ordenes, nivelProductos);
        } else {
            acumuladorInsumos[insumo] = (acumuladorInsumos[insumo] || 0) + totalInsumo; // Asegurar la acumulación correcta
        }
    }

    // Registrar la producción necesaria de este producto intermedio si no es un producto final
    if (!ordenes[producto] && formulas[producto]) {  // Verifica si el producto no está directamente en las órdenes
        const nivel = esSegundoOrden ? 'segundo orden' : 'primer orden';
        acumuladorProductos[producto] = { cantidad: (acumuladorProductos[producto]?.cantidad || 0) + numLotes * loteCantidad, nivel };
        nivelProductos[nivel][producto] = true; // Registrar el nivel del producto
    }
}

function determinar_insumos() {
    const formulas = leerFormulas('../files/recetas.txt');
    const ordenes = leerOrdenes('../files/ordenes.txt'); // Ejemplo de ordeneS
    const insumosNecesarios = {};
    const productosIntermediosNecesarios = {};
    const nivelProductos = { 'primer orden': {}, 'segundo orden': {} };


    for (const producto in ordenes) {
        calcularInsumos(formulas, producto, ordenes[producto], insumosNecesarios, productosIntermediosNecesarios, ordenes, nivelProductos);
    }

    // console.log("Materia Prima Necesaria: ",insumosNecesarios);
    // console.log("Productos Intermedios Necesarios: ",productosIntermediosNecesarios);

    return {
        insumosNecesarios: insumosNecesarios,
        productosIntermediosNecesarios: productosIntermediosNecesarios
    };
}

function restarValoresDiccionarios(dic1, dic2) {
    // Crear un nuevo diccionario para los resultados
    let resultados = {};

    // Copiar todas las claves y valores de dic1 al resultado
    Object.keys(dic1).forEach(clave => {
        resultados[clave] = dic1[clave];  // Copia todas las claves y valores de dic1
    });

    // Recorrer las claves de dic1 para verificar y restar los valores de dic2
    Object.keys(dic1).forEach(clave => {
        if (clave in dic2) {
            // Si la clave existe en ambos diccionarios y ambos son números, realiza la resta
            if (typeof dic1[clave] === 'number' && typeof dic2[clave] === 'number') {
                resultados[clave] = dic1[clave] - dic2[clave];
            }
        }
    });

    return resultados;
}

function verificarStock(stock_actual, stock_necesario) {
    // Obtener las claves de ambos objetos
    const clavesStockActual = Object.keys(stock_actual);
    const clavesStockNecesario = Object.keys(stock_necesario);

    // Comprobar si las claves de stock_actual están en stock_necesario y son mayores o iguales
    for (const clave of clavesStockActual) {
        // Verifica si la clave existe en stock_necesario
        if (!(clave in stock_necesario)) {
            return false; // Clave no existe en stock_necesario
        }
        
        // Comparar los valores si las claves son iguales
        if (stock_actual[clave] < stock_necesario[clave]) {
            return false; // El valor en stock_actual es menor que en stock_necesario para la misma clave
        }
    }

    // Verifica si todas las claves en stock_necesario están en stock_actual
    for (const clave of clavesStockNecesario) {
        if (!(clave in stock_actual)) {
            return false; // Clave de stock_necesario no encontrada en stock_actual
        }
    }

    // Si se pasan todas las verificaciones
    return true;
}

function esObjeto(objeto) {
    return objeto != null && typeof objeto === 'object';
}


async function revisar_bodega(apiUrl_desarrollo, token) {
    const Bodega = require("./bodega");
    let bodegas = ["Workshop", "buffer", "checkIn", "checkOut"]
    let id_bodegas = [];
    for (const bodega of bodegas) {

        // console.log(bodega);
        const id = await (Bodega.obtener_id_bodega_especifica(global.apiUrl_desarrollo, global.token, bodega))
        await new Promise(resolve => setTimeout(resolve, 60000 / 90));
        // console.log("ID DE BODEGAS: ", bodega, id)
        id_bodegas.push(id);

    }

    // console.log("ID", id_bodegas);

    stockInsumos = {}
    //console.log("id bodegas", id_bodegas)
    for (const id of id_bodegas) {


        let productos = await Bodega.obtener_productos_en_bodega(global.apiUrl_desarrollo, global.token, id)
        await new Promise(resolve => setTimeout(resolve, 60000 / 90));
        //console.log("PRODUCTOS", productos)


        for (let i = 0; i < productos.length; i++) {
            //if (!(productos[i]["sku"] in stockInsumos))
            //if (!stockInsumos.hasOwnProperty(id)) {
                if (!(productos[i]["sku"] in stockInsumos)){
                // console.log("PRODUCTO", productos[i])
                // console.log("COSAS", producto["sku"], producto["quantity"])
                stockInsumos[productos[i]["sku"]] = productos[i]["quantity"]
                //console.log("DICCIONARIO STOCK if1", stockInsumos)

            }

            else {

                stockInsumos[productos[i]["sku"]] += productos[i]["quantity"]
                //console.log("DICCIONARIO STOCK if2", stockInsumos)
            }
        }
    }

    console.log("DICCIONARIO STOCK", stockInsumos)

    return stockInsumos;

}



async function solicitar_insumos(apiUrl_desarrollo, token, input_flag_pedi, input_flag_llegaron, input_flag_terminaron, sku) {
    const multiplos = {
        'ESCMET': 10,
        'MADTAB1x1': 2,
        'TORNCHIC': 20,
        'PINTNEG': 4,
        'PINTBLA': 4
    };
    const multiplo = multiplos[sku];
    console.log("MULTIPLO", multiplo);

    let flag_pedi = input_flag_pedi;
    let flag_llegaron = input_flag_llegaron;
    let flag_terminaron = input_flag_terminaron;
    let stockInsumos = await revisar_bodega(global.apiUrl_desarrollo, global.token)
    await new Promise(resolve => setTimeout(resolve, 60000 / 90));
    console.log("STOCK", stockInsumos)

    let resultados = determinar_insumos();
    let InsumosNecesarios_todos = resultados.insumosNecesarios;
    let productosIntermedios = resultados.productosIntermediosNecesarios;

    console.log("INSUMOS NECESARIOS",InsumosNecesarios_todos);

    let InsumosNetos_todos = restarValoresDiccionarios(InsumosNecesarios_todos, stockInsumos);
    console.log("INSUMOS NETOS TODOS", InsumosNetos_todos);

    llaves_productos_intermedios_todos = Object.keys(InsumosNetos_todos)
    let InsumosNetos = {}
    let InsumosNecesarios = {}
    console.log("SKU SOLICITADO", sku);
    console.log("LLAVES TODOS", llaves_productos_intermedios_todos);

    if (llaves_productos_intermedios_todos.includes(sku)) {

        InsumosNetos[sku] = InsumosNetos_todos[sku]
        console.log("Holaaaaaa", sku, InsumosNetos[sku])
        InsumosNecesarios[sku] = InsumosNecesarios_todos[sku]
    }
    
   
    


    let llaves = Object.keys(InsumosNetos);
    console.log("LLAVES", llaves);
    console.log("INSUMOS NETOS", InsumosNetos);
    console.log("DEFINITIVO ", InsumosNetos[llaves[0]])
    if (!flag_pedi && !flag_llegaron && !flag_terminaron) {

        while (llaves.length > 0) {

            // console.log(llaves[0]); 

            if (InsumosNetos[llaves[0]] > 0) {
                if (InsumosNetos[llaves[0]] > 4000) {

                    console.log("SE SOLICITA PEDIDO DE: 4000 de", llaves[0])
                    const solicitar_productos = await (pedir_productos(global.apiUrl_desarrollo, global.token, llaves[0], 4000));
                    await new Promise(resolve => setTimeout(resolve, 60000 / 90));
                    InsumosNetos[llaves[0]] -= 4000;

                } else {

                    console.log("SE SOLICITA PEDIDO DE:", Math.ceil(InsumosNetos[llaves[0]] / multiplo) * multiplo, "de", llaves[0])
                    const solicitar_productos = await (pedir_productos(global.apiUrl_desarrollo, global.token,  llaves[0],  Math.ceil(InsumosNetos[llaves[0]] / multiplo) * multiplo));
                    await new Promise(resolve => setTimeout(resolve, 60000 / 90));
                    InsumosNetos[llaves[0]] -= InsumosNetos[llaves[0]];
                }
            } else {
                llaves.splice(0, 1);
            }

        }

        flag_pedi = true
        console.log("FLAG PEDI FUNC", flag_pedi)

    }

    if (flag_pedi == true && !flag_llegaron && !flag_terminaron) {

        let stockActual = await revisar_bodega(global.apiUrl_desarrollo, global.token)
        await new Promise(resolve => setTimeout(resolve, 60000 / 90));
        console.log("STOCK ACTUAL", stockActual)

        let stockActual_sku = {}
        llaves_stock_actual = Object.keys(stockActual)

        if (llaves_stock_actual.includes(sku)) {

            stockActual_sku[sku] = stockActual[sku]
        }
        

        console.log("STOCK ACTUAL SKU", stockActual_sku)
        
        console.log("DICCIONARIOS IGUALES", verificarStock(stockActual_sku, InsumosNecesarios))
        
        if (verificarStock(stockActual_sku, InsumosNecesarios)) {

            flag_llegaron = true
        }
        // COMPRAR DICCIONARIOS PARA VER SI YA LLEGARON LAS COSAS
        // TENER FLAG LLEGARON LAS COSAS
    }
    //flag_llegaron = true // SACAR ESTO!!!!!!!!!!!!!
    if (flag_pedi == true && flag_llegaron == true && !flag_terminaron) {
        console.log("EN ULTIMO LOOP")
        // WHILE CHECKIN > 0
        // OBETENR DETALLES DE LOS 199 SKU LA FUNCION
        //METER ID A LISTA
        // MOVER LOS ID A BUFFER
        //MIENTRAS QUEDEN COSAS EN EL CHECK IN
        // FALG_TERMINE CONTINUAR CON PROCESO.
        const id_bodega_checkin = await obtener_id_bodega_especifica(global.apiUrl_desarrollo, global.token, 'checkIn')
        await new Promise(resolve => setTimeout(resolve, 60000 / 90));
        const id_bodega_buffer = await obtener_id_bodega_especifica(global.apiUrl_desarrollo, global.token, 'buffer')
        await new Promise(resolve => setTimeout(resolve, 60000 / 90));
        console.log("ID BODEGA CHECKIN", id_bodega_checkin);
        let detalle_sku = await obtener_detalle_sku_en_bodega(global.apiUrl_desarrollo, global.token, id_bodega_checkin, sku)
        await new Promise(resolve => setTimeout(resolve, 60000 / 90));

        console.log(detalle_sku);
        let quedan_productos = true

        while (detalle_sku.length > 0 && quedan_productos == true) {

            console.log("ENTRE AL WHILE")
            let id_sku_checkin = []

            let ids_sku_checkin = await obtener_detalle_sku_en_bodega(global.apiUrl_desarrollo, global.token, id_bodega_checkin, sku);
            await new Promise(resolve => setTimeout(resolve, 60000 / 90));

            for (let i = 0; i < ids_sku_checkin.length; i++) {

                id_sku_checkin.push(ids_sku_checkin[i]["_id"])
            }

            console.log("LISTA ID", id_sku_checkin);


            for (let i = 0; i < id_sku_checkin.length; i++) {

                console.log("id", id_sku_checkin[i]);
                mover_producto_a_bodega(global.apiUrl_desarrollo, global.token, id_sku_checkin[i], id_bodega_buffer)
                await new Promise(resolve => setTimeout(resolve, 60000 / 90));
            }

            let detalle_sku = await obtener_detalle_sku_en_bodega(global.apiUrl_desarrollo, global.token, '6612c8cf05f75d27132bd5ee', sku)
            await new Promise(resolve => setTimeout(resolve, 60000 / 90));
            //console.log("DETALLE SKU", detalle_sku)
            if (id_sku_checkin.length <=0) {
                quedan_productos = false;
            }

        }

        console.log("Sali del while :)")
        flag_terminaron = true
        console.log("PEDI", flag_pedi, "Llegaron", flag_llegaron, "Terminaron", flag_terminaron)

    }
    console.log("FLAG PEDI FUNC2", flag_pedi)
    console.log("FLAG llegaron FUNC2", flag_llegaron)
    return [flag_pedi, flag_llegaron, flag_terminaron];


}






module.exports = {
    determinar_insumos,
    solicitar_insumos,
    revisar_bodega,
    leerFormulas
};