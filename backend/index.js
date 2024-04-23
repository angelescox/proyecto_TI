//Importar Dependencias

const express = require("express");
const logger = require('morgan');
const cors = require("cors");
const cookieParser = require('cookie-parser');
const fs = require('fs');
const readline = require('readline');
const Login = require("./controllers/login");
const Bodega = require("./controllers/bodega");
const Producto = require("./controllers/producto");
const Insumos = require("./controllers/insumos");
global.token = 0;


global.apiUrl_desarrollo = 'https://dev.proyecto.2024-1.tallerdeintegracion.cl/warehouse';
global.token_desarrollo = 'UQS^BPhM8Lf}ecqprn[69{'



//Bienvenida
console.log("Proyecto integracion iniciado")

//Flujo de funciones
async function main() {

  global.token = await Login.login(global.apiUrl_desarrollo, global.token_desarrollo);
  // console.log("Token obtenido: ", global.token);
  const bodegas = await(Bodega.obtener_bodegas(global.apiUrl_desarrollo, global.token))
  console.log("Bodegas: ", bodegas);
  //const productos_en_checkin = await(Bodega.obtener_productos_en_bodega(global.apiUrl_desarrollo, global.token, '6612c8cf05f75d27132bd5ee'));
  //console.log("Productos en Check-In: ", productos_en_checkin);
  //console.log("TOKEN: ", global.token)
  const productos_en_bodega = await(Bodega.obtener_productos_en_bodega(global.apiUrl_desarrollo, global.token, '6612c8d005f75d27132bd631'));
//   console.log("TOKEN: ", global.token)
  console.log("Productos en Workshop: ", productos_en_bodega);
  //const cantidad_productos = await (Bodega.obtener_detalle_sku_en_bodega(global.apiUrl_desarrollo, global.token, '6612c8d005f75d27132bd631', 'MADDIM40x10'));
  //console.log("Detalle de TORNCHIC en buffer: ", cantidad_productos);
  //const solicitar_productos = await (Producto.pedir_productos(global.apiUrl_desarrollo, global.token,  'ESCMET', 10));
  //console.log("Solicitando Productos: ", solicitar_productos)

  //const mover_producto = await (Producto.mover_producto_a_bodega(global.apiUrl_desarrollo, global.token, '66258c60ee728bfe5ab7a59d', '6612c8cf05f75d27132bd5e1'))
  //console.log("MOVIENDO Producto:  ", mover_producto)
  //console.log("TOKEN: ", global.token)
  // const semovio = await(Bodega.mover_sku_a_bodega(global.apiUrl_desarrollo, global.token, 'TORNCHIC', '6612c8cf05f75d27132bd5e1')); 
//   const productos_en_bodega = await(Bodega.obtener_productos_en_bodega(global.apiUrl_desarrollo, global.token, '6612c8cf05f75d27132bd5ee'));
//   console.log("Productos en Checkin: ", productos_en_bodega);
  //const productos_disponibles = await (Producto.obtener_productos_disponibles_en_mercado(global.apiUrl_desarrollo, global.token))
  // console.log("Productos disponibles en mercado: ", productos_disponibles)
  //const idworkshop = await(Bodega.obtener_id_bodega_especifica(global.apiUrl_desarrollo, global.token, 'checkIn'))
  //console.log("ID BODEGA CHECKIN:", idworkshop)
  //console.log(Insumos.determinar_insumos());

  flags_pedido_escmet = [false, false, false]
  flags_pedido_tornchic = [false, false, false]
  flags_pedido_pintbla = [false, false, false]
  flags_pedido_pintneg = [false, false, false]
  flags_pedido_madtab1X1 = [false, false, false]

  //result = await Insumos.solicitar_insumos(global.apiUrl_desarrollo, global.token,flag_pedi, flag_llegaron, flag_terminaron, "PINTNEG")

//   while (true) {
//     //Pedimos tornchic
//     if (!flags_pedido_tornchic[2]) {
//       flags_pedido_tornchic = await Insumos.solicitar_insumos(global.apiUrl_desarrollo, global.token, flags_pedido_tornchic[0], flags_pedido_tornchic[1], flags_pedido_tornchic[2], "TORNCHIC")
//     }
//     //Pedimosmadtab1x1
//     if (!flags_pedido_madtab1X1[2]) {
//       flags_pedido_madtab1X1 = await Insumos.solicitar_insumos(global.apiUrl_desarrollo, global.token, flags_pedido_madtab1X1[0], flags_pedido_madtab1X1[1], flags_pedido_madtab1X1[2], "MADTAB1x1")
//     }
//     //Pedimos escmet
//     if (!flags_pedido_escmet[2]) {
//       flags_pedido_escmet = await Insumos.solicitar_insumos(global.apiUrl_desarrollo, global.token, flags_pedido_escmet[0], flags_pedido_escmet[1], flags_pedido_escmet[2], "ESCMET")
//     }
    
//     //Pedimos pintbla
//     if (!flags_pedido_pintbla[2]) {
//       flags_pedido_pintbla = await Insumos.solicitar_insumos(global.apiUrl_desarrollo, global.token, flags_pedido_pintbla[0], flags_pedido_pintbla[1], flags_pedido_pintbla[2], "PINTBLA")
//     }
//     //Pedimos pintneg
//     if (!flags_pedido_pintneg[2]) {
//       flags_pedido_pintneg = await Insumos.solicitar_insumos(global.apiUrl_desarrollo, global.token, flags_pedido_pintneg[0], flags_pedido_pintneg[1], flags_pedido_pintneg[2], "PINTNEG")
//     }
    
//     if(flags_pedido_tornchic[2]){
//       break;
//     }

console.log("PARTIO")

await Producto.crear_productos_intermedios(true, global.apiUrl_desarrollo, global.token, "MADDIM40x10")
// const workshop = await Bodega.obtener_id_bodega_especifica(global.apiUrl_desarrollo, global.token, 'Workshop');
// const buffer = await Bodega.obtener_id_bodega_especifica(global.apiUrl_desarrollo, global.token, 'buffer');

// console.log(workshop, buffer)
//   }

console.log("TERMINAMOS BIEN")
//   // Insumos.revisar_bodega(global.apiUrl_desarrollo, global.token)

}
main()

//Conexion base de datos

//Crear servidor node
const app = express();
const PORT = process.env.PORT || 8080;
//Configurar session (ChatGpt)




////////////////////////////////////////////////////////////////

//const routes = require('./routes/index');
//const {errorHandler, notFoundError} = require('./middlewares/errors/errorHandler');

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
//app.use(routes);
//app.use(errorHandler);
//app.use(notFoundError);

module.exports = app;

/////////////////////////////////////
//Cargar conf rutas/////////////////
const HealthRoutes = require("./routes/health")

app.use("/api", HealthRoutes);

//Poner servidor a escuchar peticiones http
app.listen(PORT, () => {
  console.log("Servidor Node corriendo en puerto: ", PORT)
})



/*
const session = require("express-session")
const {connection} = require("./database/connection")
connection()
const DatabaseRoutes = require("./routes/database")
const UserRoutes = require("./routes/user")
const PublicationRoutes = require("./routes/publication")
const FollowRoutes = require("./routes/follow")
const CommentRoutes = require("./routes/comment")

app.use("/api", DatabaseRoutes);
app.use("/api", UserRoutes);
app.use("/api", PublicationRoutes);
app.use("/api", FollowRoutes);
app.use("/api", CommentRoutes);

*/



