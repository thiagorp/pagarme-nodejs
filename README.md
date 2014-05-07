pagarme-nodejs
==============

Módulo principal
----------------

A api começa com um wrapper para todos os resources que forem adicionados. Para carregar a api basta dar um require no módulo e o executar passando a `api_key` como parâmetro. Ex.:

```javascript
var pagarme = require('pagarme-nodejs')('ak_test_Rw4JR98FmYST2ngEHtMvVf5QJW7Eoo');
```

O código acima retorna um objeto que contém todos os resources.

Para adicionar um novo resource à api, basta adicioná-lo ao objeto do arquivo `available-models.js`, por exemplo:

```javascript
module.exports = {
    transactions: require('./lib/transactions')
};
```

O código acima adiciona o resource Transactions, cujo código está no arquivo `/lib/transactions.js`, à api.

Criando um novo resource
----------------------------

Como base para todos os resources que forem sendo adicionados ao sistema, eu criei o objeto Model. A partir deste objeto é possivel adicionar um resource completo com pouco código. O exemplo abaixo é o código mínimo para criar um resource, no caso o *transactions*:

```javascript
// lib/transactions.js
module.exports = Model.extend({
    path: '/transactions'
});
```

```javascript
// available-models.js
module.exports = {
    transactions: require('./lib/transactions')
};
```

Os códigos descritos acima adicionam um resource transaction com os métodos create, all, findById, update, findBy. Um exemplo de uso seria:

```javascript
var pagarme = require('pagarme-nodejs')('ak_test_Rw4JR98FmYST2ngEHtMvVf5QJW7Eoo');

var transactionObj = {
  payment_method: 'boleto',
  amount: 1000,
  postback_url: 'http://seusite.com/postback'
};

pagarme.transactions.create(transactionObj, function(err, transaction) {
  if (!err) {
    console.log(transaction);
  }
});

pagarme.transactions.all(function(err, transactions) {
  if (!err) {
    console.log(transactions.length); //10
  }
});

pagarme.transactions.all({count: 2, page: 1}, function(err, transactions) {
  if (!err) {
    console.log(transactions.length); //2
  }
});

pagarme.transactions.findById(id, function(err, transaction) {
  if (!err) {
    console.log(transaction);
  }
});

var criteria = {
  customer: {
    document_number: 36433809847
  },
  page: 2,
  count: 5
};

pagarme.transactions.findBy(criteria, function(err, transactions) {
  if (!err) {
    console.log(transactions.length); // Max 5
  };
});
```

Portanto, chamando o método Model.extend e passando um objeto apenas com o *path* ja cria um resource com as funcionalidades CRUD do mesmo. Caso não queira alguns métodos dos que estão disponíveis, basta passar os nomes em um vetor na propriedade *exclude* do objeto. Por exemplo:

```javascript
module.exports = Model.extend({
    path: '/transactions',
    exclude: ['update']
});
```

Com o código acima o resource `pagarme.transactions` não terá o método update.

Adicionando métodos aos resources
---------------------------------

Para adicionar um método diferente dos disponíveis, ou sobrescrever algum com confirgurações diferentes, deve-se adicionar uma chave, do mesmo nome que o método, ao objeto que é passado como parâmetro para Model.extend. Para facilitar a criação desse método foi criado o *helper* Model.createMethod, que é uma função que recebe um objeto como parâmetro e retorna a função que realizará a chamada do método. Por exemplo: 

```javascript
module.exports = Model.extend({
  path: '/transactions',

  exclude: ['update'],

  refund: Model.createMethod({
    method: 'POST',
    urlData: '/{id}/refund'
  })
});
```

O código acima adiciona o método *refund* ao resource *transactions*. Pode-se notar que esse método é um *POST* para a url */transactions/{id}/refund*. Quando há a presença de parametros entre chaves em *urlData*, esses parametros viram parametros do método na ordem que foram adicionados. Por exemplo, a assinatura do método adicionado acima é  `refund(id, [params, [callback]]);`. Assim os parametros são substituidos na url.

O único campo obrigatório para `Model.createMethod` é o campo *method*. Outro campo opcional, além de *urlData*, é o *before*, que é chamado antes de a requisição ser enviado e deve ser uma função que recebe os seguintes parâmetros:

* `body`      - o corpo da requisição caso seja necessário fazer alguma alteração
* `callback`  - um callback que deve ser chamado quando a função acaba de processar, para casos de chamadas de funções asíncronas. Esse callback pode receber um parâmetro de erro, caso esse parâmetro seja passado o request não será completado e será retornado este erro no callback do método.

Exemplo:

```javascript
module.exports = Model.extend({
  path: '/transactions',

  exclude: ['update'],

  create: Model.createMethod({
    method: 'POST',
    before: function(body, callback) {
      body.payment_method = body.payment_method || 'credit_card';
      body.installments = body.installments || 1;
      body.status = body.status || 'local';
      
      callback();
    }
  })
});
```

O exemplo acima sobrescreve o método create e adiciona alguns campos ao corpo da requisição caso estejam faltando.

Conclusão
---------

Bem, espero que não tenha esquecido de explicar nada e que tenham gostado do código. Por favor me perguntem sobre qualquer coisa que não tenha ficado clara.
