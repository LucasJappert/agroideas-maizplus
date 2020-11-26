var _CacheVersion1 = 'AgroIdeasPWA-v=11';
var _ArchivosCacheados = [
    './index.html',
    
    // '/js/app.js',
    // '/js/chunk-vendors.js',

    // '/img/logo-agroideas.7436c321.png',
    // '/img/logo-maiz-plus.8a3f6b67.png',

    // // '/main.html',
    // // '/Images/404.jpg',
    // '/favicon.ico'
];

self.addEventListener('install', function (e) {
    try {
        //Para omitir el skipWaiting y lo refresque automaticamente.
        self.skipWaiting();

        caches.keys().then(function (keyList) {
            return Promise.all(keyList.map(function (key) {
                if (key !== _CacheVersion1) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        });
        e.waitUntil(

            caches.open(_CacheVersion1).then(function (cache) {
                console.log('[ServiceWorker] Caching app shell');
                return cache.addAll(_ArchivosCacheados);
            })
        );

        console.log('[ServiceWorker] Install');
    } catch (error) { console.log(error);}
});

self.addEventListener('activate', function (e) {
    try
    {
        console.log('[ServiceWorker] Activate');
        e.waitUntil(
            caches.keys().then(function (keyList) {
                return Promise.all(keyList.map(function (key) {
                    console.log(key);
                    if (key !== _CacheVersion1)
                    {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                    }
                }));
            })
        );
        return self.clients.claim();

    } catch (error) { console.log(error); }
});

function RecursoFisico(_url){
    var _Retorno = false;
    try {
        var _Split = _url.split("/");
        // if(_Split[_Split.length - 1].match(/.*\.(png|jpg|js|json|css|svg|html|woff2|otf|ico)/g)){
        if(_url.match(/.*\.(png|jpg|js|json|css|svg|html|woff2|otf|ico)/g)){
            _Retorno = true;
        }
    } catch (error) {
        console.log(error);
    }
    return _Retorno;
}
function RecursoApi(_url){
    var _Retorno = false;
    try {
        if(_url.includes("/agroideas/")){
            _Retorno = true;
        }
        if(_url.includes("/users/login")){
            _Retorno = true;
        }
    } catch (error) {
        console.log(error);
    }
    return _Retorno;
}
function RecursoUpload(_url){
    var _Retorno = false;
    try {
        if(_url.includes("/uploads/pdf")){
            _Retorno = false;
        }
        else if(_url.includes("/upload")){
            _Retorno = true;
        }
    } catch (error) {
        console.log(error);
    }
    return _Retorno;
}
function ArchivosExcluido(_url){
    var _Retorno = false;
    try {
        if(_url.includes("sockjs-node") || _url.includes(".hot-update.js")){
            _Retorno = true;
        }
        if(_url.includes(".googleapis.") || _url.includes("maps.gstatic.")){
            _Retorno = true;
        }
    } catch (error) {
        console.log(error);
    }
    return _Retorno;
}

self.addEventListener('fetch', function (e) {
    try
    {        
        // return false; //Descomentar para ignorar PWA

        var _Url = e.request.url.toLowerCase();
        //console.log(_Url);
        //console.log(e);

        var _Match = true;
        var _ArchivoFisico = false; var _SolicitudAPI = false;
        var _RetornoIndexHTML = false;

        
        _ArchivoFisico = RecursoFisico(_Url);
        _SolicitudAPI = RecursoApi(_Url);

        if(ArchivosExcluido(_Url) || RecursoUpload(_Url) || _SolicitudAPI){
            //console.log(_Url);
            //console.log(ArchivosExcluido(_Url), RecursoUpload(_Url), _SolicitudAPI);
            return false;
        }

        //console.log("RecursoApi? (" + _Url + ") ---> " + _SolicitudAPI);
        //console.log("RecursoUpload? (" + _Url + ") ---> " + RecursoUpload(_Url));
        if (_Match)// && !_SolicitudAPI)
        {
            e.respondWith(
                fetch(e.request).then(
                    function (response) {
                        //console.log("2): " + _Url + "---" + (response != null));
                        if (response != null) {
                            var _ResponseCloned = response.clone();
                            if (response.status != 200) {
                                console.log("Caso2");
                                throw new Error();
                                //return response; Quizas sacar el throw y devolver el repsonse (ver) 
                            } else {
                                //Guardo en caché
                                if(!_SolicitudAPI){
                                    caches.open(_CacheVersion1).then(function (cache) {
                                        //console.log('[ServiceWorker] Nuevo elemento cacheado: ' + _Url);
                                        cache.put(_Url, _ResponseCloned);
                                    }).catch((error) => {
                                        console.error('[Cache] exception!', error);
                                    })
                                }
                                //Retorno la respuesta del server
                                return response;
                            }
                        } else {
                            // console.log("Recuperado de sw: - " + _Url);
                            console.log("Caso1");
                            return response;
                        }
                    }
                ).catch(() => {
                    //Se da cuando pierde la conexion o lo que se solicita no existe
                    return caches.open(_CacheVersion1).then(function (cache) {
                        var _Aux = _Url;
                        if(!_ArchivoFisico && !_SolicitudAPI){
                            var _Aux = (_Url.indexOf("localhost") > -1) ? "./index.html" : "/agroideas-maizplus/index.html";
                            //var _Aux = "./index.html";
                            // if(_Url.includes(_Asd)){
                            //     _Aux = _Asd + "index.html";
                            // }else{
                            //     _Aux = "./index.html";
                            // }
                        } 
                        console.log(_Aux);
                        return cache.match(_Aux).then(function (response) {
                            //console.log("21): " + e.request.url);
                            if (!response) {
                                //No lo tengo en caché entonces retorno el NotFound
                                console.log('NotFound1: ' + _Url);
                                //return cache.match('NotFound.html');
                                //return response;
                                return false;
                            } else {
                                //Retorno versión en caché
                                console.log('[Offline] Retorno de caché: ', _Aux);
                                return response;
                            }
                        })
                    })

                })
            );
        } else {
            console.log('[Offline] No se pudo recuperar: ' + e.request.url);
            return false;
            return fetch(e.request).then(
                function (response) {
                    //console.log('1 - ' + e.request.url + ' - ' + _Match);
                    return response;
                }
            ).catch(() => {
                console.log('catch1 - ' + e.request.url + ' - ' + _Match);
                //console.log('asdsadsadasdasd');
            });
            //e.respondWith(
            //    caches.match(e.request).then(function (response) {
            //        if (!response) {
            //            return fetch(e.request).catch(() => {
            //                console.log('NotFound sin match: ' + e.request.url);
            //                console.log('NotFound sin match1: ' + response);
            //                return caches.match('NotFound.html');
            //            })
            //        } else {
            //            return response;
            //        }
            //    })
            //);
        }
    }
    catch (error) {
        console.log(error);
    }
});

// self.addEventListener('fetch', function (e) {
//     try
//     {        
//         return false;
//         var _Url = e.request.url.toLowerCase();
        
//         //Retorno si es algo de mercadopago
//         if (_Url.indexOf("mercadopago") > -1) {
//             return false;
//         }
//         //Retorno si es algo de googleads
//         if (_Url.indexOf("googleads") > -1) {
//             return false;
//         }
//         //Retorno si es el carrito
//         if (_Url.indexOf("/carrito/servicios") > -1) {
//             return false;
//         }

//         if ((_Url.indexOf("localhost:") > -1) || (_Url.indexOf("megatone.net") > -1) || (_Url.indexOf("megatonewc.grupobazar") > -1)) {
//             //Sigue normal
//         }
//         else {
//             return false;
//         }

//         //console.log("1): " + e.request.url);
        
//         //console.log("1): " + e.request.url);
//         var _Match = false;
//         var _UrlN = e.request.url;
//         if ((_Url.indexOf("recursosweb.asmx") > -1) || (_Url.indexOf("producto.asmx") > -1)) {
//             _Match = true;
//         }
//         else if (_Url.match(/.*\/(producto|search|listado|landing)\/.*/g)) {
//             _Match = true;
//         } else if (_Url.match(/.*\.(png|jpg|js|json|css|svg|html|woff2|otf|ico)/g) && ((_Url.indexOf("localhost") > -1) || (_Url.indexOf("megatone.net") > -1) || (_Url.indexOf("megatonewc.grupobazar") > -1))) {
//             _Match = true;
//         } else if (_UrlN.match(/.*\/WsProducto\/.*|WsEspecificacionesProducto\/.*|RecursosWeb.asmx\/.*|WsProductosSugeridos\/.*|WsProductosSimilares\/.*/g)) {
//             _Match = true;
//         }

//         //if (_Url.match(/.*(localhost.*|megatone.net.*)\/.*/g)) {
//         //    _Match = true;
//         //}

//         if ((_Url.indexOf("localhost") > -1) || (_Url.indexOf("megatone.net") > -1) || (_Url.indexOf("webservices") > -1)) {
//             _Match = true;
//         }


//         if (_Match)
//         {
//             //Chequeo si el Match es del dominio megatone.net, para de esta manera setear la variable _Par
//             var _OtroDominio = false;
//             var _Par = { };
//             if ((_Url.indexOf("megatone.net") > -1) && (_Url.indexOf("recursosweb.asmx") == -1)) {
//                 _Par = {
//                     mode: 'no-cors'
//                 };
//                 _OtroDominio = true;
//             }

//             if ((_Url.indexOf("megatone.net") == -1) || (_Url.indexOf("localhost") == -1)) {
//                 //Para que salte el throw
//                 _OtroDominio = true;
//             }

//             e.respondWith(
//                 fetch(e.request, _Par).then(
//                     function (response) {
//                         //console.log("2): " + e.request.url + "---" + (response != null));
//                         if (!response) {
//                             var _ResponseCloned = response.clone();
//                             if (response.status != 200 && _OtroDominio == false) {
//                                 console.log('throw: ' + e.request.url);
//                                 throw new Error();
//                             } else {
//                                 //Guardo en caché
//                                 caches.open(_CacheVersion1).then(function (cache) {
//                                     //console.log('[ServiceWorker] Nuevo elemento cacheado: ' + e.request.url);
//                                     cache.put(e.request.url, _ResponseCloned);
//                                 }).catch((error) => {
//                                     console.error('[Cache] exception!', error);
//                                 })
//                                 //Retorno la respuesta del server
//                                 return response;
//                             }
//                         } else {
//                             return response;
//                         }
//                     }
//                 ).catch(() => {
//                     //console.log("2): " + e.request.url);
//                     return caches.open(_CacheVersion1).then(function (cache) {
//                         return cache.match(e.request.url).then(function (response) {
//                             //console.log("21): " + e.request.url);
//                             if (!response) {
//                                 //No lo tengo en caché entonces retorno el NotFound
//                                 console.log('NotFound1: ' + e.request.url);
//                                 return cache.match('NotFound.html');
//                                 //return response;
//                             } else {
//                                 //Retorno versión en caché
//                                 //console.log('[Cache] Retorno caché: ', response);
//                                 return response;
//                             }
//                         })
//                     })

//                 })
//             );
//         } else {
//             return fetch(e.request).then(
//                 function (response) {
//                     //console.log('1 - ' + e.request.url + ' - ' + _Match);
//                     return response;
//                 }
//             ).catch(() => {
//                 console.log('catch1 - ' + e.request.url + ' - ' + _Match);
//                 //console.log('asdsadsadasdasd');
//             });
//             //e.respondWith(
//             //    caches.match(e.request).then(function (response) {
//             //        if (!response) {
//             //            return fetch(e.request).catch(() => {
//             //                console.log('NotFound sin match: ' + e.request.url);
//             //                console.log('NotFound sin match1: ' + response);
//             //                return caches.match('NotFound.html');
//             //            })
//             //        } else {
//             //            return response;
//             //        }
//             //    })
//             //);
//         }
//     }
//     catch (error) {
//         console.log(error);
//     }
// });

self.addEventListener('push', function (event) {
    //try {
    //console.log("Evento push:");
    //console.log(event);
    //clients.navigator.update();

    console.log('[Service Worker] Push Received.');
    //var _Texto = event.data.text();
    var _Data = event.data.text().split('*');
    //0 = Icono
    //1 = Titulo
    //2 = Descrcipcion
    //3 = Url
    //4 = ImagenBody

    //var _Icono = 'https://www.megatone.net/images/App-Push/icon.png';
    var _Icono = _Data[0];
    const title = _Data[1];
    var _Texto = _Data[2];
    var _ImagenBody = _Data[4];

    console.log(_Data[5]);

    var _UrlRedirect = "";
    var _IdNotificacionJS = 0;
    var _IdUserJS = 0;

    _UrlRedirect = _Data[3];
    _IdNotificacionJS = parseInt(_Data[5]);
    _IdUserJS = parseInt(_Data[6]);

    var options = {
        body: _Texto,
        icon: _Icono,
        badge: _Icono,
        image: "",
        tag: ""
    };

    if (_ImagenBody != "") {
        options = {
            body: _Texto,
            icon: _Icono,
            badge: _Icono,
            image: _ImagenBody,
            tag: _IdNotificacionJS + "*" + _IdUserJS + "*" + _UrlRedirect
        };
    }

    const notificationPromise = self.registration.showNotification(title, options);
    event.waitUntil(notificationPromise);

    //} catch (error) {
    //    console.log(error);
    //}
});

self.addEventListener('notificationclick', function (event) {

    var _UrlRedirect = "";
    var _IdNotificacionJS = 0;
    var _IdUserJS = 0;
    try {
        console.log(event.notification);
        if (event.notification.tag != "") {
            var _Data = event.notification.tag.split('*');
            _IdNotificacionJS = parseInt(_Data[0]);
            _IdUserJS = parseInt(_Data[1]);
            _UrlRedirect = _Data[2];
        }
    } catch (error) { console.log(error); }

    console.log('[Service Worker] Notification click Received.');

    event.notification.close();

    var _Aux = "?";
    if (_UrlRedirect.indexOf('?') > -1) {
        _Aux = "&";
    }
    if (_IdNotificacionJS == 0 || _IdUserJS == 0) {
        _UrlRedirect = "/";
    }
    event.waitUntil(
        clients.openWindow(_UrlRedirect + _Aux + "n=" + _IdNotificacionJS + "&u=" + _IdUserJS)
    );
});



