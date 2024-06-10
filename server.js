const express = require("express");
const app = express();
const cors = require('cors');
const http = require('http');
const https = require('https');
const fs = require('fs');
const passport = require('passport');
const ActiveDirectoryStrategy = require('passport-activedirectory');
const rateLimit = require('express-rate-limit');
const jsonParser = express.json();
const mongoose = require("mongoose");
const moment = require("moment")


const ActiveDirectory = require('activedirectory2');
const config = {
    url: 'ldap://domain-controller.domain.local',
    baseDN: 'dc=domain,dc=local',
    username: 'domain_admin_username',
    password: 'domain_admin_password',
    attributes: {
      user: ['displayName', 'userPrincipalName']
    }
};

const ad = new ActiveDirectory(config);

const PORT = process.env.PORT || 3255;
const HTTPport = 3650;
const SECPORT = 8080;

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
})

const Schema = mongoose.Schema;

const RecordScheme = new Schema ({
    typeVKS: String,
    judgeName: String,
    date: String,
    time: String,
    room: Number,
    caseNumber: String,
    courtName: String,
    input: String,
    additions: String,
    length: Number
  }, {versionKey: false}
);

const RoomScheme = new Schema ({room: Number});
const JudgeScheme = new Schema ({judgeName: String});
const CourtScheme = new Schema ({type: String, names: [String]});

const Record = mongoose.model("record", RecordScheme);
const Court = mongoose.model("court", CourtScheme);
const Judge = mongoose.model("judge", JudgeScheme);
const Room = mongoose.model('room', RoomScheme);

app.use(express.static(__dirname + "/public"));

app.use(cors({
  origin: 'http://127.0.0.1:3000',
  credentials: true,
  optionSuccessStatus: 200,
  methods: ['GET', 'POST', 'DELETE', 'PUT']
}));

const httpsServer = https.createServer(
    {
      key: fs.readFileSync("server.key"),
      cert: fs.readFileSync("server.crt"),
    },
    app
  );
httpsServer.listen(SECPORT, function () {
    console.log("https запущен на порту: " + SECPORT);
});

const httpServer = http.createServer(app);
httpServer.listen(HTTPport, function() {
    console.log("http запущен на порту: " + HTTPport)
});

mongoose.connect("mongodb://database-address:port", { useUnifiedTopology: true, useNewUrlParser: true }, function(err){
    if(err) return console.log(err);
    app.listen(PORT, function(){
        console.log("Сервер запущен на порту "+ PORT);
    });
});

app.get("/records", (reg, res) => {
  Record.find({}, function (err, records){
    if(err) {
        res.status(500).send({message: 'Не удалось получить записи из базы'})
        console.log(err);
        return
    };
    res.json(records);
  });
});

app.get("/records/:date", (req, res) => {
    const date = req.params.date;
    Record.find({date: date}, function (err, records) {
      if(err) {
          res.status(500).send({message: 'Не удалось получить записи из базы'});
          console.log(err);
          return
      };
      res.json(records);
    });
});

app.get('/courts', (reg, res) => {
  Court.find({}, function (err, courts){
    if(err) return console.log(err);
    res.json(courts);
  });
});

app.get('/judges', (req, res) => {
  Judge.find({}, function (err, judges){
    if(err) {
        res.status(500).send({message: 'Не удалось получить записи из базы'});
        console.log(err);
        return
    };
    res.json(judges);
  });
});

app.get('/rooms', (req, res) => {
  Room.find({}, function (err, rooms){
    if(err) {
        res.status(500).send({message: 'Не удалось получить записи из базы'});
        console.log(err);
        return
    };
    res.json(rooms);
  });
});

app.post('/checkJudges', jsonParser, (req, res) => {
  var checking;
  var id = req.body.id;
  if (!id) id = null;
  let request = {
    id: id,
    judgeName: req.body.judgeName,
    date: req.body.date,
    time: req.body.time,
    length: req.body.length
  }
  Record.find({
      judgeName: request.judgeName,
      date: request.date,
      _id: { $ne: request.id }
    },
    function (err, records){
        if(err) {
          res.status(500).send({message: 'Ошибка проверки статуса'})
          console.log(err);
          return
        }
      var good = true;
      checking = records;
      checking.sort((prev, next) => {
        if (prev.time < next.time) return -1;
        if (prev.time > next.time) return 1;
        return 0;
      })
      checkingTime = moment(request.date + '' + request.time, 'DD-MM-YYYY HH:mm', false);
      checking.forEach((record) => {
          if (!good) return
          let recordTime = moment(record.date + '' + record.time, 'DD-MM-YYYY HH:mm', false);
          let diff = (checkingTime.diff(recordTime, 'minutes'));
          if (diff === 0) {
            good = false;
            res.status(200).json({check: false, message: `Судья ${record.judgeName} занят на это время!`});
            return
          }
          else if (request.length + diff > 0 && diff < 0) {
            good = false;
            res.status(200).json({check: false, message: `Слишком длинное заседание, оно не успеет закончиться до начала следующего у судьи ${record.judgeName}!`});
            return
          }
          else if (diff - record.length < 0  &&  diff > 0) {
            good = false;
            res.status(200).json({check: false, message: `Судья ${record.judgeName} всё ещё будет на заседании!` });
            return
          }
        })
      if (good) res.status(200).json({check: true});
      return
  });
});

app.post('/checkRooms', jsonParser, (req, res) => {
  var checking;
  var id = req.body.id;
  if (!id) id = null;
  let request = {
    room: req.body.room,
    date: req.body.date,
    time: req.body.time,
    length: req.body.length,
    id: id
  }
  Record.find({
      room: request.room,
      date: request.date,
      _id: { $ne: request.id }
    },
    function (err, records){
        if(err) {
          res.status(500).send({message: 'Ошибка проверки статуса'})
          console.log(err);
          return
        }
      var good = true;
      checking = records;
      checking.sort((prev, next) => {
        if (prev.time < next.time) return -1;
        if (prev.time > next.time) return 1;
        return 0;
      })
      checkingTime = moment(request.date + '' + request.time, 'DD-MM-YYYY HH:mm', false);
      checking.forEach((record) => {
          if (!good) return
          let recordTime = moment(record.date + '' + record.time, 'DD-MM-YYYY HH:mm', false);
          let diff = (checkingTime.diff(recordTime, 'minutes'));
          console.log('diff', diff, request.length, record.length)
          if (diff === 0) {
            good = false;
            res.status(200).json({check: false, message: `Зал ${record.room} занят на это время!`});
            return
          }
          else if (request.length + diff > 0 && diff < 0) {
            good = false;
            res.status(200).json({check: false, message: `Слишком длинное заседание, зал ${record.room} не успеет освободиться к началу следующего заседания!`});
            return
          }
          else if (diff - record.length < 0 &&  diff > 0) {
            good = false;
            res.status(200).json({check: false, message: `В зале ${record.room} всё ещё будет заседание!`});
            return
          }
        })
      if (good) res.status(200).json({check: true});
      return
  });
})

app.post("/judges/insert", jsonParser, (req, res) => {
  var request = {
    judgeName: req.body.judgeName,
  }
  console.log(request);
  if (!request) return res.status(500).send({message: 'В запросе нет данных.'});
  Judge.create(request, (err, doc) => {
    if(err) {
      res.status(500).send({message: 'Не удалось создать запись!'});
      return console.log(err);
    };
    console.log("Создана запись о судье", doc);
    res.sendStatus(200);
  })
});

app.post("/rooms/insert", jsonParser, (req, res) => {
  var request = {
    room: req.body.room,
  }
  console.log(request);
  if (!request) return res.status(500).send({message: 'В запросе нет данных.'});
  Room.create(request, (err, doc) => {
    if(err) {
      res.status(500).send({message: 'Не удалось создать запись!'});
      return console.log(err);
    };
    console.log("Создана запись о зале", doc);
    res.sendStatus(200);
  })
});

app.post("/courts/insert", jsonParser, (req, res) => {
  var request = {
    type: req.body.type,
    names: req.body.names,
  }
  console.log(request);
  if (!request) return res.status(500).send({message: 'В запросе нет данных.'});
  Room.create(request, (err, doc) => {
    if(err) {
      res.status(500).send({message: 'Не удалось создать запись!'});
      return console.log(err);
    };
    console.log("Создана запись о группе судов", doc);
    res.sendStatus(200);
  })
});

app.post("/records/insert", jsonParser, (req, res) => {
  var request = {
    typeVKS: req.body.typeVKS,
    judgeName: req.body.judgeName,
    date: req.body.date,
    time: req.body.time,
    room: req.body.room,
    caseNumber: req.body.caseNumber,
    courtName: req.body.courtName,
    input: req.body.input,
    additions: req.body.additions,
    length: req.body.length
  }
  console.log('request', request);
  if (!request) return res.status(500).send({message: 'В запросе нет данных.'});
  Record.create(request, (err, doc) => {
    if(err) {
      res.status(500).send({message: 'Не удалось создать запись!'});
      return console.log(err);
    };
    console.log("Создана запись о заседании", doc);
    res.sendStatus(200);
  })
});

app.delete("/records/delete/:id", (req, res) => {
  const id = req.params.id;
  console.log("id ", id);
  Record.findByIdAndDelete(id, function(err, rec){
    if(err) {
        res.sendStatus(500).send(err);
        console.log(err);
        return
      };
    console.log("Запись о заседании " + id + ' удалена', rec);
    res.sendStatus(200)
  });
});

app.delete("/judges/delete/:id", (req, res) => {
  const id = req.params.id;
  console.log("id ", id);
  Judge.findByIdAndDelete(id, function(err, rec){
    if(err) {
        res.sendStatus(500).send(err);
        console.log(err);
        return
      };
    console.log("Запись о судье " + id + ' удалена', rec);
    res.sendStatus(200)
  });
});

app.delete("/rooms/delete/:id", (req, res) => {
  const id = req.params.id;
  console.log("id ", id);
  Room.findByIdAndDelete(id, function(err, rec){
    if(err) {
        res.sendStatus(500).send(err);
        console.log(err);
        return
      };
    console.log("Запись о зале " + id + ' удалена', rec);
    res.status(200).send({message: 'Запись удалена'})
  });
});

app.delete("/courts/delete/:id", (req, res) => {
  const id = req.params.id;
  console.log("id ", id);
  Court.findByIdAndDelete(id, function(err, rec){
    if(err) {
        res.sendStatus(500).send(err);
        console.log(err);
        return
      };
    console.log("Запись о группе судов " + id + ' удалена', rec);
    res.sendStatus(200)
  });
});

app.put('/record/update/:id', jsonParser, (req, res) => {
  const id = req.params.id;
  console.log('id: ', req.params.id);
  console.log('body: ', req.body);
  var request = {
    typeVKS: req.body.type,
    judgeName: req.body.judgeName,
    date: req.body.date,
    time: req.body.time,
    room: req.body.room,
    caseNumber: req.body.caseNumber,
    courtName: req.body.courtName,
    additions: req.body.additions,
    length: req.body.length,
  }
  Record.findByIdAndUpdate(id, request, function(err, rec){
    if(err) {
        console.log(err);
        res.status(500).send({message: 'Не удалось обновить запись'})
        return
    };
    console.log("Запись id: " + id + ' обновлена ', rec);
    res.sendStatus(200);
  });
});

app.put('/courts/update/:id', jsonParser, (req, res) => {
  const id = req.params.id;
  console.log('id: ', req.params.id);
  console.log('body: ', req.body);
  var request = {
    type: req.body.type,
    names: req.body.names
  }
  Court.findByIdAndUpdate(id, request, function(err, rec){
    if(err) {
        console.log(err);
        res.status(500).send({message: 'Не удалось обновить запись'})
        return
    };
    console.log("Запись id: " + id + ' обновлена ', rec);
    res.sendStatus(200);
  });
});

app.post('/login', jsonParser, (req, res) => {
    var username = req.body.username;
    var password = req.body.password;
    ad.authenticate(username, password, function(err, auth) {
        if (err) {
            console.log('ERROR: '+JSON.stringify(err));
            if (err.lde_message.includes("80090308")) {
              res.status(401).send({message: 'Неверные данные для входа!'});
            }
            else {
                res.status(500).send({message: 'Не удалось войти из-за ошибки авторизации на сервере.'});
            }
            return;
        }
        if (auth) {
            var loggedUserData = {
              displayName: null,
              isAdmin: false,
            };
            console.log('Authenticated: ' + username);
            ad.isUserMemberOf(username, 'IT-group', function(err, isAdmin) {
              if (err) {
                console.log('ERROR: ' +JSON.stringify(err));
                res.status(500).send({message: 'Не удалось войти из-за ошибки проверки групп пользователя.'});
                return;
              }
              loggedUserData.isAdmin = isAdmin;
              res.status(200).send(loggedUserData)
            });
            ad.findUser(username, function(err, user) {
                if (err) {
                  console.log('ERROR: ' +JSON.stringify(err));
                  res.status(500).send({message: 'Не удалось войти из-за ошибки получения данных пользователя.'})
                  return;
                }
                loggedUserData.displayName = user.displayName
            });
        }
        else {
            console.log('Authentication failed!');
            res.status(401).send({message: 'Неверные данные входа!'});
        }
    });
});
