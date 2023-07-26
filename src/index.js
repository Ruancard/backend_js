const express = require("express");
const app = express();
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const multer = require("multer");

const client = multer.diskStorage({
  destination: function (rec, file, cb) {
    cb(null, "src/public/uploads/clientes");
  },
  filename: function (req, file, cb) {
    cb(null, `${req.body.numero}.png`);
  },
});

const adv = multer.diskStorage({
  destination: function (rec, file, cb) {
    cb(null, "src/public/uploads/advogados");
  },
  filename: function (req, file, cb) {
    cb(null, `${req.body.numero}.png`);
  },
});

const cliente = multer({ storage: client });
const advogado = multer({ storage: adv });

const PORT = 3000;
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "SecretKey",
    resave: true,
    saveUninitialized: true,
  })
);

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "admin",
  database: "advocacia",
  connectionLimit: 10,
});

app.use(bodyParser.json());
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  if (!req.session.username) {
    res.redirect("/entrar");
    return;
  }
  pool.query("SELECT * FROM processos", (error, results) => {
    if (error) {
      console.error("Error executing query", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      const processos = results;
      res.render("home.ejs", {
        processos: processos,
        usuario: req.session.username,
        page: "home",
      });
    }
  });
});

app.get("/advogados", (req, res) => {
  if (!req.session.username) {
    res.redirect("/entrar");
    return;
  }
  pool.query("SELECT * FROM advogados", (error, results) => {
    if (error) {
      console.error("Error executing query", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      const advogados = results;
      res.render("advogados.ejs", {
        advogados: advogados,
        usuario: req.session.username,
        page: "advogados",
      });
    }
  });
});

app.get("/clientes", (req, res) => {
  if (!req.session.username) {
    res.redirect("/entrar");
    return;
  }
  pool.query("SELECT * FROM clientes", (error, results) => {
    if (error) {
      console.error("Error executing query", error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      const clientes = results;
      res.render("clientes.ejs", {
        clientes: clientes,
        usuario: req.session.username,
        page: "clientes",
      });
    }
  });
});

app.get("/profile/:usuario", (req, res) => {
  const usuario = req.params["usuario"];
  if (!req.session.username) {
    res.redirect("/entrar");
    return;
  }
  pool.query(
    `select processos.numero, processos.nome, requerente, reu, acusacao, defesa, juiz, vara, dt_inicio from processos inner join advogados on processos.acusacao = advogados.nome or processos.defesa = advogados.nome where usuario = "${usuario}"`,
    (error, results) => {
      if (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        const processos = results;
        pool.query(
          `SELECT * FROM advogados where usuario = "${usuario}"`,
          (error, results) => {
            if (error) {
              console.error("Error executing query", error);
              res.status(500).json({ error: "Internal Server Error" });
            } else {
              const advogado = results[0];
              res.render("perfil.ejs", {
                advogado: advogado,
                processos: processos,
                usuario: req.session.username,
                page: "perfil",
              });
            }
          }
        );
      }
    }
  );
});

app.get("/clientes/:cpf", (req, res) => {
  const cpf = req.params["cpf"];
  if (!req.session.username) {
    res.redirect("/entrar");
    return;
  }
  pool.query(
    `SELECT * FROM clientes where cpf = "${cpf}"`,
    (error, results) => {
      if (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        const cliente = results[0];
        pool.query(
          `select processos.numero, processos.nome, requerente, reu, acusacao, defesa, juiz, vara, dt_inicio from processos inner join clientes on processos.reu = clientes.nome or processos.requerente = clientes.nome where cpf = "${cpf}"`,
          (error, results) => {
            if (error) {
              console.error("Error executing query", error);
              res.status(500).json({ error: "Internal Server Error" });
            } else {
              const processos = results;
              res.render("cliente.ejs", {
                cliente: cliente,
                processos: processos,
                usuario: req.session.username,
                page: "cliente",
              });
            }
          }
        );
      }
    }
  );
});

app.get("/processos/:numero", (req, res) => {
  const numero = req.params["numero"];
  if (!req.session.username) {
    res.redirect("/entrar");
    return;
  }
  pool.query(
    `SELECT * FROM processos where numero = "${numero}"`,
    (error, results) => {
      if (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        res.render("processo.ejs", {
          processo: results[0],
          usuario: req.session.username,
          page: "cliente",
        });
      }
    }
  );
});

app.get("/criarprocesso", (req, res) => {
  if (!req.session.username) {
    res.redirect("/entrar");
    return;
  }
  res.render("criarprocesso.ejs", {
    usuario: req.session.username,
    page: "adicionar processo",
  });
});

app.get("/criarcliente", (req, res) => {
  if (!req.session.username) {
    res.redirect("/entrar");
    return;
  }
  res.render("criarcliente.ejs", {
    usuario: req.session.username,
    page: "adicionar cliente",
  });
});

app.get("/criaradvogado", (req, res) => {
  pool.query(
    `SELECT * FROM advogados where usuario = "${req.session.username}"`,
    (error, results) => {
      if (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        if (results.length > 0) {
          if (results[0].admin == true) {
            res.render("criaradvogado.ejs", {
              usuario: req.session.username,
              page: "adicionar cliente",
            });
          } else {
            res.redirect("/");
          }
        } else {
          res.redirect("/entrar");
        }
      }
    }
  );
});

app.get("/editarprocesso/:processo", (req, res) => {
  const processo = req.params["processo"];
  if (!req.session.username) {
    res.redirect("/entrar");
    return;
  }
  pool.query(
    `SELECT * FROM processos where numero = "${processo}"`,
    (error, results) => {
      if (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        const processo = results[0];
        res.render("editarprocesso.ejs", {
          processo: processo,
          usuario: req.session.username,
          page: "editarprocesso",
        });
      }
    }
  );
});

app.get("/entrar", (__, res) => {
  res.render("login.ejs");
});

app.post("/login", (req, res) => {
  usuario = req.body.username;
  senha = req.body.password;
  pool.query(
    `SELECT * FROM advogados where usuario = "${usuario}" and senha = "${senha}"`,
    (error, results) => {
      if (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        if (results.length > 0) {
          req.session.username = usuario;
          res.redirect("/");
        } else {
          res.redirect("/entrar");
        }
      }
    }
  );
});

app.post("/addprocesso", (req, res) => {
  const numero = req.body.numero;
  const nome = req.body.nome;
  const dt_inicio = req.body.dt_inicio;
  const observacao = req.body.observacao;
  const descricao = req.body.descricao;
  const acusacao = req.body.acusacao;
  const defesa = req.body.defesa;
  const requerente = req.body.requerente;
  const reu = req.body.reu;
  const juiz = req.body.juiz;
  const vara = req.body.vara;

  pool.query(
    `INSERT INTO processos (numero, nome, dt_inicio, observacao, descricao, acusacao, defesa, requerente, reu, juiz, vara) VALUES ("${numero}", "${nome}", "${dt_inicio}", "${observacao}", "${descricao}", "${acusacao}", "${defesa}", "${requerente}", "${reu}", "${juiz}", "${vara}")`,
    (error, results) => {
      if (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        res.redirect("/");
      }
    }
  );
});

app.post("/edtprocesso/:processo", (req, res) => {
  const processo = req.params["processo"];
  const nome = req.body.nome;
  const observacao = req.body.observacao;
  const descricao = req.body.descricao;
  const acusacao = req.body.acusacao;
  const defesa = req.body.defesa;
  const requerente = req.body.requerente;
  const reu = req.body.reu;
  const juiz = req.body.juiz;
  const vara = req.body.vara;
  const link = req.body.link;
  const dt = new Date();
  const dt_att = `${dt.getFullYear()}-${("0" + (dt.getMonth() + 1)).slice(
    -2
  )}-${("0" + dt.getDate()).slice(
    -2
  )} ${dt.getHours()}:${dt.getMinutes()}:${dt.getSeconds()}`;
  pool.query(
    `update processos set nome = "${nome}", observacao = "${observacao}", descricao = "${descricao}", acusacao = "${acusacao}", defesa = "${defesa}", requerente = "${requerente}", reu = "${reu}", juiz = "${juiz}", vara = "${vara}", dt_att = "${dt_att}", link = "${link}" where numero = "${processo}"`,
    (error, results) => {
      if (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        res.redirect("/");
      }
    }
  );
});

app.post("/addcliente", cliente.single("arquivo"), (req, res) => {
  const cpf = req.body.numero;
  const nascimento = req.body.nascimento;
  const nome = req.body.nome;
  const email = req.body.email;
  const tel = req.body.tel;
  const estado = req.body.estado;
  const cidade = req.body.cidade;
  const bairro = req.body.bairro;
  const cep = req.body.cep;
  const rua = req.body.rua;
  const numero = req.body.num;

  pool.query(
    `INSERT INTO clientes (cpf, nome, nascimento, email, tel, estado, cidade, bairro, rua, numero, cep) VALUES ("${cpf}", "${nome}", "${nascimento}", "${email}", "${tel}", "${estado}", "${cidade}", "${bairro}", "${rua}", "${numero}", "${cep}")`,
    (error, results) => {
      if (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        res.redirect("/");
      }
    }
  );
});

app.post("/addadvogado", advogado.single("arquivo"), (req, res) => {
  const oab = req.body.numero;
  const usuario = req.body.usuario;
  const senha = req.body.senha;
  const admin = req.body.admin;
  const cpf = req.body.cpf;
  const nascimento = req.body.nascimento;
  const nome = req.body.nome;
  const email = req.body.email;
  const tel = req.body.tel;
  const estado = req.body.estado;
  const cidade = req.body.cidade;
  const bairro = req.body.bairro;
  const cep = req.body.cep;
  const rua = req.body.rua;
  const numero = req.body.num;

  pool.query(
    `INSERT INTO advogados (oab, usuario, senha, admin, cpf, nome, nascimento, email, tel, estado, cidade, bairro, rua, numero, cep) VALUES ("${oab}", "${usuario}", "${senha}", "${admin}", "${cpf}", "${nome}", "${nascimento}", "${email}", "${tel}", "${estado}", "${cidade}", "${bairro}", "${rua}", "${numero}", "${cep}")`,
    (error, results) => {
      if (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        res.redirect("/");
      }
    }
  );
});

app.get("/logout", (req, res) => {
  req.session.username = null;
  res.redirect("/entrar");
});

app.listen(3000, () => {
  console.log(`Server running on port ${PORT}`);
});
