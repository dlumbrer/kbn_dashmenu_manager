export default function (server) {
    /**
   * Fileds to retrieve
   */
  const dataCluster = server.plugins.elasticsearch.getCluster('data');
  const call = dataCluster.callWithInternalUser;
  const basePath = server.config().get('server.basePath');

  server.route({
    path: '/api/malice/example',
    method: 'GET',
    handler(req, reply) {
      reply({ time: (new Date()).toISOString() });
    }
  });

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

  server.route({
    path: '/api/get_dashboards',
    method: 'GET',
    handler(req, reply) {
  
        let config = {
            index: ".kibana",
            size: 5,
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

}


