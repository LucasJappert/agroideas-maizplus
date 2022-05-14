// Change the version to force the SW to update (install and activate)
const version = "1.0.6";
const staticCache = 'AgroideasApp-staticCache-' + version;
const dynamicCache = 'AgroideasApp-dynamicCache-' + version;
var staticFiles = [
    "./index.html",
];

self.addEventListener('install', function (e) {
    try {
        self.skipWaiting();
        e.waitUntil(
            caches.open(staticCache).then(function (cache) {
                console.log('[ServiceWorker] Caching app shell data');
                return cache.addAll(staticFiles);
            })
        )
        console.log('[ServiceWorker] Install');
    } catch (e) { console.error(e); }
});

self.addEventListener('activate', function (event) {
    try {
        console.log('[ServiceWorker] Activate');
        event.waitUntil(
            caches.keys().then(function (keyList) {
                return Promise.all(keyList.map(function (key) {
                    if (key !== staticCache && key !== dynamicCache) {
                        console.log('[ServiceWorker] Removing old cache', key);
                        return caches.delete(key);
                    }
                }));
            })
        );
        return self.clients.claim();
    } catch (e) {
        console.error(e);
    }
});

function ExcludedFile(fileUrl) {
    var result = false;
    try {
        const strings = [
            'sockjs-node',
            '.googleapis.',
            'maps.gstatic.',
            'hot-update.js',
            'use.fontawesome.com'
        ];
        for (var i = 0; i < strings.length; i++) {
            if (fileUrl.includes(strings[i])) {
                result = true;
                break;
            }
        }
    } catch (error) {
        console.log(error);
    }
    return result;
}

self.addEventListener('fetch', function (event) {
    try {
        const requestUrl = event.request.url.toLowerCase();
        if (ExcludedFile(requestUrl)) {
            return false;
        }

        let parCors = {};

        event.respondWith(
            // Check if exist in cache.
            caches.match(event.request)
            .then(cacheRes => {
                if (cacheRes) {
                    return fetch(event.request, parCors).then(fetchRes => {
                        saveInDynamicCache(fetchRes.clone(), event);
                        return fetchRes;
                    }).catch(err => {
                        console.error(err);
                        return cacheRes;
                    });
                } else {
                    return fetch(event.request, parCors).then(fetchRes => {
                        saveInDynamicCache(fetchRes.clone(), event);
                        return fetchRes;
                    })
                }
            })
            .catch(() => {
                // If the file is not in cache and there is no internet connection
                if (event.request.mode === 'navigate') {
                    //TODO:
                    console.log(event.request);
                    var indexPath = requestUrl.indexOf("localhost") > -1 ? "./index.html" : "./agroideas-maizplus/index.html";
                    //index.html should be in static cache
                    return caches.match(indexPath);
                    // if (requestUrl.includes("lib/pdfjs/web/viewer.html")) {
                    //     return caches.match('lib/pdfjs/web/viewer.html');
                    // } else {
                    //     //console.log(requestUrl);
                    //     return caches.match('es/errorpwa');
                    // }
                }
            })
        );

    } catch (error) {
        console.log(error);
    }
});

const okStatus = [200, 201, 202, 203, 204, 205];
function saveInDynamicCache(fetchRes, event) {
    if (okStatus.includes(fetchRes.status)) {
        caches.open(dynamicCache).then(cache => {
            cache.put(event.request.url, fetchRes);
        })
    }
}

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



