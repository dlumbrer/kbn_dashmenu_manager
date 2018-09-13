import elasticsearch from "elasticsearch";
import url from 'url';
import Boom from 'boom';
const readFile = (file) => require('fs').readFileSync(file, 'utf8');
export default function (server) {

    /*
    This function is wrapped in order to do the ES petitions with the same user that is doing the petition to the plugin
    */
    const configElastic = (username, password) => {
        const es_url = server.config().get('elasticsearch.url');
        const config = server.config();

        const options = {
            url: config.get('elasticsearch.url'),
            username: username,
            password: password,
            verifySsl: config.get('elasticsearch.ssl.verificationMode') == 'none' ? false : true,
            clientCrt: config.get('elasticsearch.ssl.certificate'),
            clientKey: config.get('elasticsearch.ssl.key'),
            apiVersion: "_default",
            pingTimeout: config.get('elasticsearch.pingTimeout'),
            requestTimeout: config.get('elasticsearch.requestTimeout'),
            keepAlive: true,
            auth: true
        };

        const uri = url.parse(options.url);
        let authorization;
        if (options.auth && options.username && options.password) {
            uri.auth = options.username+ ':' + options.password;
        }

        const ssl = { rejectUnauthorized: options.verifySsl };
        if (options.clientCrt && options.clientKey) {
            ssl.cert = readFile(options.clientCrt);
            ssl.key = readFile(options.clientKey);
        }
        if (options.ca) {
            ssl.ca = options.ca.map(readFile);
        }

        const host = {
            host: uri.hostname,
            port: uri.port,
            protocol: uri.protocol,
            path: uri.pathname,
            auth: uri.auth,
            query: uri.query,
            headers: config.get('elasticsearch.customHeaders')
        };

        let client = new elasticsearch.Client({
            host,
            ssl,
            plugins: options.plugins,
            apiVersion: options.apiVersion,
            keepAlive: options.keepAlive,
            pingTimeout: options.pingTimeout,
            requestTimeout: options.requestTimeout
        });
        return client
    }
   ////////////////////////////////////////////////


    /**
   * Fileds to retrieve
   */
  const dataCluster = server.plugins.elasticsearch.getCluster('data');
  const call = dataCluster.callWithInternalUser;
  const basePath = server.config().get('server.basePath');

  //Get Indices
  server.route({
    path: '/api/get_indices',
    method: 'GET',
    handler(req, reply) {
        let client = configElastic(req.auth.credentials._credentials.username, req.auth.credentials._credentials.password)
        client.cat.indices({
            h: ['index', 'doc_count']
        }).catch(function (err) {
            // Catch unathourized error
            if (err.status === 403) {
                console.log("Forbidden")
                reply(Boom.forbidden('invalid user'))
                return -1;
            } else if (err.status === -1){
                // Other errors
                reply(Boom.notFound('unexpected error', err))
                return -1;
            }
        }).then(function (resp) {
            if(resp !== -1){

                let indices = [];

                resp.forEach(function (elem) {

                    if ((elem.index !== '.kibana'))
                        indices.push({id: elem.index, name: elem.index});
                });

                reply({indices: indices});
            }
        });
    }
  })

  //Get Kibana Dashboards
  server.route({
    path: '/api/get_dashboards',
    method: 'GET',
    handler(req, reply) {
  
        let config = {
            index: ".kibana",
            size: 1000,
            body: {
              "query": {
                "bool": {
                    "must": [
                        {
                            "term": {
                                "type": "dashboard"
                            }
                        }
                    ]
                }
              }
            }
        };
        let client = configElastic(req.auth.credentials._credentials.username, req.auth.credentials._credentials.password)
        client.search(config)
        .catch(function (err) {
            // Catch unathourized error
            if (err.status === 403) {
                console.log("Forbidden")
                reply(Boom.forbidden('invalid user'))
                return -1;
            } else if (err.status === -1){
                // Other errors
                reply(Boom.notFound('unexpected error', err))
                return -1;
            }
        }).then(function (resp) {
            if(resp !== -1){
                reply({dashboards: resp.hits.hits});
            }
        });
    }
  });

  //Get the metadashboard
  server.route({
    path: '/api/get_metadashboard',
    method: 'GET',
    handler(req, reply) {
        let config = {
            index: ".kibana",
            size: 1000,
            body: {
              "query": {
                "terms": {
                    "_id": [ "metadashboard" ] 
                }
              }
            }
        };
        call('search', config).then(function (resp) {
            reply({metadashboard: resp.hits.hits});
        });
    }
  });

  //Update mapping
  server.route({
    path: '/api/update_mapping',
    method: 'POST',
    handler(req, reply) {
        let config = {
            index: ".kibana",
            type: "doc",
            body: req.payload
        };

        let client = configElastic(req.auth.credentials._credentials.username, req.auth.credentials._credentials.password)
        client.indices.putMapping(config)
        .catch(function (err) {
            // Catch unathourized error
            if (err.status === 403) {
                console.log("Forbidden")
                reply(Boom.forbidden('invalid user'))
                return -1;
            } else if (err.status === -1){
                // Other errors
                reply(Boom.notFound('unexpected error', err))
                return -1;
            }
        }).then(function (resp) {
            if(resp !== -1){
                reply("OK");
            }
        });
    }
  });

  //Put new metadashboard
  server.route({
    path: '/api/update_metadashboard',
    method: 'POST',
    handler(req, reply) {
        let config = {
            index: ".kibana",
            type: "doc",
            id: "metadashboard",
            body: req.payload
        };

        let client = configElastic(req.auth.credentials._credentials.username, req.auth.credentials._credentials.password)
        client.create(config).catch(function (err) {
            // Catch unathourized error
            if (err.status === 403) {
                console.log("Forbidden")
                reply(Boom.forbidden('invalid user'))
                return -1;
            } else if (err.status === -1){
                // Other errors
                reply(Boom.notFound('unexpected error', err))
                return -1;
            }
        }).then(function (resp) {
            if(resp !== -1){
                reply("OK");
            }
        });
    }
  });

  //Put new metadashboard
  server.route({
    path: '/api/delete_metadashboard',
    method: 'POST',
    handler(req, reply) {
        let config = {
            index: ".kibana",
            type: "doc",
            id: "metadashboard"
        };

        let client = configElastic(req.auth.credentials._credentials.username, req.auth.credentials._credentials.password)
        client.delete(config).catch(function (err) {
            // Catch unathourized error
            if (err.status === 403) {
                console.log("Forbidden")
                reply(Boom.forbidden('invalid user'))
                return -1;
            } else if (err.status === -1){
                // Other errors
                reply(Boom.notFound('unexpected error', err))
                return -1;
            }
        }).then(function (resp) {
            if(resp !== -1){
                reply("OK");
            }
        });
    }
  });

}


