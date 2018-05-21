export default function (server) {
    /**
   * Fileds to retrieve
   */
  const dataCluster = server.plugins.elasticsearch.getCluster('data');
  const call = dataCluster.callWithInternalUser;
  const basePath = server.config().get('server.basePath');

  server.route({
    path: '/api/kbn_dashmenu_management/example',
    method: 'GET',
    handler(req, reply) {
      reply({ time: (new Date()).toISOString() });
    }
  });

  //Get Indices
  server.route({
    path: '/api/get_indices',
    method: 'GET',
    handler(req, reply) {

        call('cat.indices', {format: 'json'}).then(function (resp) {

            let indices = [];

            resp.forEach(function (elem) {

                if ((elem.index !== '.kibana'))
                    indices.push({id: elem.index, name: elem.index});
            });

            reply({indices: indices});
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
  
        call('search', config).then(function (resp) {
  
            let dashboards = [];
          
            //console.log(resp.hits.hits)
  
            reply({dashboards: resp.hits.hits});
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

}


