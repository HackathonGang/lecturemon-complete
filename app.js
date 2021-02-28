//------------- Routing and Session Stuff -------------
const express = require('express');
const app = express();
const session = require('express-session');
const cookieParser = require('cookie-parser');
const validator = require('validator');
const bcrypt = require('bcrypt');
const cors = require('cors');
const json = require('body-parser');
const FileStore = require('session-file-store')(session);

app.use(cors());
app.use(express.static('static'));
app.use(express.json());
app.use(cookieParser());
// Uses sessions
app.use(session({
    secret: '4dcb417e-381e-42cf-8f6a-5f0244bddb3c',
    resave: false,
    saveUninitialized: false,
    store: new FileStore,
    cookie: { maxAge: 3600000,secure: false, httpOnly: true }
}))

//------------- Database Stuff -------------
const path = require('path');
const dbPath = path.resolve(__dirname, 'data/data.db');
const sqlite3 = require('sqlite3').verbose(); // verbose gives longer traces in case of error
const extPath = path.resolve(__dirname, 'data/json1.so');

//Creates connection the db
function createdb () {
    let db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            return console.error(err.message);
        }
    });
    return db;
}

app.get('/', function(req, resp) {
    
})

db = createdb();
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT,
        uni_email TEXT NOT NULL,
        contact_email TEXT NOT NULL,
        password TEXT NOT NULL,
        year_group INTEGER,
        xp INTEGER NOT NULL
    );`, err => {
        if (err) {
          return console.error(err.message);
        }
    })
    .run(`CREATE TABLE IF NOT EXISTS module_lookup (
        user_id INTEGER NOT NULL,
        module_id INTEGER NOT NULL,
        status INTEGER NOT NULL
    );`, err => {
        if (err) {
          return console.error(err.message);
        }
    })
    .run(`CREATE TABLE IF NOT EXISTS modules (
        module_id INTEGER PRIMARY KEY,
        uni_id INTEGER NOT NULL,
        module_name TEXT NOT NULL,
        module_code TEXT NOT NULL,
        lecturer_id INTEGER NOT NULL
    );`, err => {
        if (err) {
          return console.error(err.message);
        }
    }) // in future add course_id and year?
    .run(`CREATE TABLE IF NOT EXISTS lecturers ( 
        lecturer_id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
    );`, err => {
        if (err) {
          return console.error(err.message);
        }
    })
    .run(`CREATE TABLE IF NOT EXISTS lectures ( 
        lecture_id INTEGER PRIMARY KEY,
        module_id INTEGER NOT NULL,
        start_date_time INTEGER NOT NULL,
        end_date_time INTEGER NOT NULL
    );`, err => {
        if (err) {
          return console.error(err.message);
        }
    })
    .run(`CREATE TABLE IF NOT EXISTS surveys_sent (
        survey_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        sent INTEGER NOT NULL
    );`, err => {
        if (err) {
          return console.error(err.message);
        }
    })
    // maybe, instead we have a table that has un-1 lectures - delete rows after email sent? - check when db updated
    // .run(`CREATE TABLE IF NOT EXISTS courseworks ( 
    //      coursework_id INTEGER PRIMARY KEY,
    //      module_id INTEGER NOT NULL,
    //      start_date_time INTEGER NOT NULL,
    //      end_date_time INTEGER NOT NULL,
    //      survey_sent INTEGER NOT NULL
    // );`, err => {
    //     if (err) {
    //       return console.error(err.message);
    //     }
    // })
    .run(`CREATE TABLE IF NOT EXISTS survey_templates (
        template_id INTEGER PRIMARY KEY,
        format TEXT NOT NULL
    );`, err => {
        if (err) {
          return console.error(err.message);
        }
    }) // use a standard format described here: [] to format the strings?
    .run(`CREATE TABLE IF NOT EXISTS surveys (
        survey_id INTEGER PRIMARY KEY,
        survey_formatted TEXT NOT NULL,
        module_id INTEGER NOT NULL,
        template_id INTEGEr NOT NULL
    );`, err => {
        if (err) {
          return console.error(err.message);
        }
    })
    .run(`CREATE TABLE IF NOT EXISTS lecture_responses (
        response_id INTEGER PRIMARY KEY,
        module_id INTEGER NOT NULL,
        lecture_id INTEGER NOT NULL,
        survey_id INTEGER  NOT NULL,
        response TEXT NOT NULL
    );`, err => {
        if (err) {
          return console.error(err.message);
        }
    })
    .run(`CREATE TABLE IF NOT EXISTS coursework_responses (
        response_id INTEGER PRIMARY KEY,
        coursework_id INTEGER NOT NULL,
            module_id INTEGER NOT NULL,
            survey_id INTEGER  NOT NULL,
        response TEXT NOT NULL
    );`, err => {
        if (err) {
          return console.error(err.message);
        }
    })
    .run(`CREATE TABLE IF NOT EXISTS module_responses (
        response_id INTEGER PRIMARY KEY,
        module_id INTEGER NOT NULL,
        survey_id INTEGER  NOT NULL,
        response TEXT NOT NULL
    );`, err => {
        if (err) {
          return console.error(err.message);
        }
    })
    .run(`CREATE TABLE IF NOT EXISTS unis (
        uni_id INTEGER PRIMARY KEY,
        extension TEXT NOT NULL,
        name TEXT NOT NULL
    );`, err => {
        if (err) {
          return console.error(err.message);
        }
    })
    .run(`CREATE TABLE IF NOT EXISTS cards (
        card_id INTEGER PRIMARY KEY,
        card_rarity TEXT NOT NULL,
        module_id INTEGER NOT NULL,
        module_name TEXT NOT NULL,
        module_code TEXT NOT NULL,
        name TEXT NOT NULL
    );`, err => {
        if (err) {
          return console.error(err.message);
        }
    })
    .run(`CREATE TABLE IF NOT EXISTS card_user (
        user_id INTEGER NOT NULL,
        card_id INTEGER NOT NULL
    );`, err => {
        if (err) {
          return console.error(err.message);
        }
    })
    // .get(`SELECT * FROM unis`, function(err, rows) {
    //     console.log(rows);
    // })
    // .run(`INSERT INTO unis (extension, name) VALUES ('yes', 'no')`, err => {
    //     if (err) {
    //       return console.error(err.message);
    //     }
    //     console.log("Successful creation of the 'Books' table");
    // })
    // .get(`SELECT * FROM unis`, function(err, rows) {
    //     console.log(rows);
    // })
});

db.close();

const Unis = ['durham', 'warwick'];

//------------- Routing Stuff -------------
//POST Signup
app.post('/api/signup', function(req, resp) {
    const errorlist = [];
    var errors = [[0, 'name', 'Need a valid name'],
    [0, 'password', 'Need a valid password (minimum length 8, must have at least one uppercase, lowercase, number and symbol)'],
    [0, 'uni', 'Need a valid Uni'],
    [0, 'uniemail', 'Need a valid uni Email'],
    [0, 'uniemail', 'Email already in use'],
    [0, 'useremail', 'Need a contact Email'],];
    //Validating Name
    if (!(req.body.name) || !(/^[a-zA-Z\s]+$/.test(req.body.name))) {
        errors[0][0] = 1;
    }
    //Validating Password
    if (!(req.body.password) || !(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/.test(req.body.password))) {
        errors[1][0] = 1;
    }
    //Validating Uni
    if (!Unis.includes((req.body.uni).toLowerCase())) {
        errors[2][0] = 1;
    }
    //Validating Uni Email
    if (!(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.ac.uk$/.test(req.body.uniemail)) || !(req.body.uniemail.includes(req.body.uni))) { //Add check for uni email address to selected uni
        errors[3][0] = 1;
    }
    db = createdb();
    let duplicate;
    db.get(`SELECT uni_email FROM users WHERE uni_email = ?;`, [req.body.uniemail] , function (err, row) {
        //console.log(row);
        if (row !== undefined) {
            valid(1);
        }
        else {
            valid(0);
        }
        })
    
    function valid (duplicate) {
        db.close();
        errors[4][0] = duplicate;
        //Validating User Email
        if (!req.body.useremail) {
            req.body.useremail = user.body.uniemail;
        }
        if (!(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(req.body.useremail))) {
            errors[5][0] = 1;
        }
        for (let error = 0; error < errors.length; error++) {
            if (errors[error][0] == 1) {
                errorlist.push({error:errors[error][2], errorField:errors[error][1]})
            }
        }

        if (errorlist.length > 0) {
            resp.status(400).json(errorlist);
            return;
        }
        //Splitting Name
        const first_name = req.body.name.split(' ')[0];
        const uni_email = req.body.uniemail;
        const contact_email = req.body.useremail;
        const uni = req.body.uni;
        let last_name = '';
        if (req.body.name.split(' ')[1]) {
            last_name = req.body.name.replace(req.body.name.split(' ')[0], '');
        }
        //Adding data to database
        db = createdb();
        bcrypt.hash(req.body.password, 10, function(err, hash) {
            db.serialize(() => {
                db.run(`INSERT INTO users (first_name, last_name, uni_email, contact_email, password, xp)
                VALUES (?, ?, ?, ?, ?, 0);`, [first_name, last_name, uni_email, contact_email, hash], err => {
                    if (err) {
                        return console.error(err.message);
                    }
                });
                resp.sendStatus(200);
                db.close();
            })
        }); 
    }   
});

//POST Signin
app.post('/api/signin', function(req, resp) {
    if (!(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.ac.uk$/.test(req.body.uniemail))) {
        resp.status(400).json([{"error-field":"uniemail", "error": "Need a valid uni Email"}]);
    }
    if (!req.body.password) {
        resp.status(400).json([{"error-field":"password", "error": "Need to enter a password"}]);
    }
    db = createdb();
    db.get(`SELECT uni_email, password, user_id, first_name, last_name, xp FROM users WHERE uni_email = ?`, [req.body.uniemail],  function (err, row) {
        if (row == undefined) {
            resp.status(400).json([{"error-field":"uniemail", "error": "Uni Email not found"}]);
        }
        else {
            bcrypt.compare(req.body.password, row.password, function(err, result) {
                if (result) {
                    req.session.user_id = row.user_id;
                    req.session.name = row.first_name + row.last_name;
                    req.session.xp = row.xp;
                    resp.status(200).json({"name": row.first_name+row.last_name, "id":row.user_id, "xp":row.xp});
                }
                else {
                    resp.status(400).json([{"error-field":"password", "error": "Incorrect Password"}]);
                }
            });
        }
    });
});

const Users = [];

var Validator = require('jsonschema').Validator;
const { SSL_OP_NO_QUERY_MTU } = require('constants');
const { nextTick } = require('process');
var v = new Validator();

var responseSchema = {
    "type": "object",
    "properties": {
      "survey_id": {
        "type": "integer"
      },
      "target": {
        "type": "integer"
      },
      "target_type": {
        "type": "string",
        "pattern": "(lecture|module)"
      },
      "answers": {
        "type": "array",
        "items": 
          {
            "type": "string"
          }
      }
    },
    "required": [
      "survey_id",
      "target",
      "target_type",
      "answers"
    ]
};

//GET Timetable
app.get('/api/timetable', function(req, resp) {
    // returns users lectures in the following form:
    // {
    //      "module_code": [(lecture1_starttime, lecture1_endtime), (lecture2_starttime, lecture2_endtime)],
    //      "module_code": ...    
    //}


    // grab module IDs from module_lookup
    // grab their start/end/names times from module
    // return a json containging module name, list of tuples for lectures
    let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READ, (err) => {
        if (err) {
            return console.error(err.message);
        }
    });

    let moduleIDs = [];
    let jsonDict = {};
    
    db.serialize(() =>{
        db.each(`SELECT (module_id) FROM module_lookup WHERE user_id = ${req.user_id}`, (err, row) => {
            moduleIDs.push(row[0]);
        });
        moduleIDs.forEach(id => {
            let code = db.get(`SELECT (module_code) FROM modules WHERE module_id = ${id}`)[0];
            jsonDict[code] = [];
            db.each(`SELECT (date_time_start, date_time_end) FROM lectures WHERE module_id = ${id}`, (err, row) => {
                jsonDict[code].push((row[0], row[1]));
            });
        });
    });

    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
    });

    resp.status(200);
    resp.send(JSON.stringify(jsonDict));
});

//POST Survey Response
app.post('/api/surveyresponse', function(req, resp) {
    // if (v.validate(req, responseSchema)) {
    if (1==1) {
        let survey_id   = req.body.survey_id;
        let target      = req.body.target;
        let target_type = req.body.target_type;
        if (target_type == "lecture") {
            db = createdb();

            db.serialize(() => {
                db.run(`INSERT INTO lecture_responses 
                (lecture_id, module_id, survey_id, response) VALUES 
                (?, ?, ?, ?);`, [target, req.body.module_id, survey_id, req.answers] ,err => {
                    if (err) {
                        console.error(err);
                    }
                });
                db.run(`UPDATE users SET xp = ? WHERE user_id = ?`, [req.session.xp+10, req.session.user_id], err => {
                    if (err) {
                        resp.sendStatus(400);
                        return;
                    }
                })
                req.session.xp += 10;
            });

        } else if (target_type == "module") {
            let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                    return console.error(err.message);
                }
            });

            db.serialize(() => {
                db.run(`INSERT INTO module_responses 
                (module_id, survey_id, response) VALUES 
                (?, ?, ?);`, [target, survey_id, req.answers], err => {
                    if (err) {
                        console.error(err);
                    }
                });
                db.run(`UPDATE users SET xp = ? WHERE user_id = ?`, [req.session.xp+10, req.session.user_id], err => {
                    if (err) {
                        console.error(err);
                    }
                })
                req.session.xp += 25;
                db.get(`SELECT card_id FROM cards WHERE module_id = ?`, [target], (err, row) => {
                    if (err) {
                        console.error(err);
                    }
                    next(row);
                    function next(row) {
                        db.run(`INSERT INTO card_users (user_id, card_id) VALUES (?, ?)`, [req.session.user_id, row.card_id], err => {
                            if (err) {
                                console.error(err);
                            }
                        })
                    }
                })
                db.get('UPDATE surveys_sent SET sent = 1 WHERE user_id = ? and survey_id = ?', [req.session.user_id, survey_id], err => {
                    if (err) {
                        console.error(err);
                    }
                })
            });

        } else {
            resp.status("422").send('Invalid rating type, can only rate "lecture" or "module');
        }


        db.close((err) => {
            if (err) {
                return console.error(err.message);
            }
        });

    } else {
        resp.status("422").send("Invalid JSON sent for survey response");
    }
    resp.status("200").send("Successfuly recorded response");

});

app.post('/api/createsurveytemplate', function(req, resp) {
    db = createdb();

    db.run(`INSERT INTO survey_templates (format) VALUES (?)`, [escape(JSON.stringify(req.body))], (err) => {
        if (err) {
            console.error(err);
        } else {
            resp.sendStatus(200);
        }
    });

    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
    });
});

app.post('/api/sendsurvey', function(req, resp) {
    if (!req.body.survey_id, !req.body.module_id) {
        resp.sendStatus(400);
    }
    db = createdb();

    let arr = []
    let args = []

    db.each(`SELECT user_id FROM module_lookup WHERE module_id = ? AND status = 0`, [req.body.module_id], (err, row) => {
        // console.log(row);
        arr.push(row['user_id']);
    }, (err, rows) => {
        console.log(arr);
        arr.forEach(user_id => {
            args.push(req.body.survey_id);
            args.push(user_id);
        });
        db.run(`INSERT INTO surveys_sent (survey_id, user_id, sent) VALUES (?,?,0)`, args, (err) => {
            console.log(args); 
            if (err) {
                console.error(err);
            }
        });
        db.close((err) => {
            if (err) {
                return console.error(err.message);
            }
        });
    });
    resp.sendStatus(200);



})

app.post('/api/adduni', function(req, resp) {
    if (!req.body.name || !req.body.extension) {
        resp.sendStatus(400);
    }
    db = createdb();

    db.run(`INSERT INTO unis (name, extension) VALUES (?, ?)`, [req.body.name, req.body.extension], (err) => {
        if (err) {
            console.error(err);
        } else {
            resp.sendStatus(200);
        }
    });

    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
    });
});


app.post('/api/addlecturer', function(req, resp) {
    if (!req.body.name) {
        resp.sendStatus(400);
    }
    db = createdb();

    db.run(`INSERT INTO lecturers (name) VALUES (?)`, [req.body.name], (err) => {
        if (err) {
            console.error(err);
        } else {
            resp.sendStatus(200);
        }
    });

    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
    });
});


app.post('/api/enroll', function(req, resp) {
    if (!req.body.module_id, !req.session.user_id) {
        resp.sendStatus(400);
    }
    db = createdb();

    db.run(`INSERT INTO module_lookup (user_id, module_id, status) VALUES (?,?,0)`, [req.session.user_id, req.body.module_id], (err) => {
        if (err) {
            console.error(err);
        } else {
            resp.sendStatus(200);
        }
    });

    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
    });
});

//List of Surveys
app.get('/api/surveys', function(req, resp) {
    if (!req.session.user_id) {
        resp.sendStatus(400);
    }
    let user_id = req.session.user_id;
    db = createdb();
    let newJson = []
    console.log(user_id);

    db.each(`SELECT surveys_sent.survey_id, format FROM surveys INNER JOIN surveys_sent ON surveys.survey_id=surveys_sent.survey_id INNER JOIN survey_templates ON survey_templates.template_id = surveys.template_id  WHERE surveys_sent.sent=0 AND surveys_sent.user_id=?;`, [user_id], (err, row) => {
        // console.log(row);
        // console.log(unescape(row['format']));
        let oldJson = JSON.parse(unescape(row["format"]));
        // console.log(oldJson);
        newJson.push({"survey_id": row["survey_id"], "survey_type": oldJson["target_type"], "survey_name": oldJson["survey_title"]});
    }, (err, rows) => {
        // console.log(newJson);
        resp.status("200").json(newJson);
    });

    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
    });
    // console.log(newJson);

});

function renderTemplate(template, module_code, module_name, module_id) {
    // console.log(template);
    // console.log(module_code);
    // console.log(module_name);
    for (let [key, value] of Object.entries(template)) {
        if (key != "questions" && key != "target") {
            template[key] = value.replace('[code]', module_code).replace('[name]', module_name);
        }
    }
    template["target"] = module_id
    // console.log(template);
    return template;
}

app.post('/api/createmodulesurvey', function(req, resp) {
    db = createdb();
    if (req.body.template_id && req.body.module_id) {
        db.get(`SELECT format, module_code, module_name FROM survey_templates INNER JOIN modules ON module_id = ? WHERE template_id = ?`, [req.body.module_id, req.body.template_id], (err, row) => {
            // console.log(row);
            let rendered=renderTemplate(JSON.parse(unescape(row['format'])), row['module_code'], row['module_name']);
            db.run(`INSERT INTO surveys (survey_formatted, module_id, template_id) VALUES (?,?,?)`, [escape(JSON.stringify(rendered)), req.body.module_id, req.body.template_id], (err) => {
                if (err) {
                    console.error(err);
                    resp.sendStatus(400);
                    let rendered=renderTemplate(JSON.parse(unescape(row['format'])), row['module_code'], row['module_name'], req.body.module_id);
                    db.run(`INSERT INTO surveys (survey_formatted, module_id, template_id) VALUES (?,?,?)`, [escape(JSON.stringify(rendered)), req.body.module_id, req.body.template_id], (err) => {
                        if (err) {
                            console.error(err);
                            resp.sendStatus(400);
                        } else {
                            resp.status(200).json(rendered);
                            db.close((err) => {
                                if (err) {
                                }
                            });
                        }
                    });
                }
            });
        });


    }

    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
    });
});

app.post('/api/addmodule', function(req, resp) {
    if (!req.body.uni_id || !req.body.module_name || !req.body.module_code || !req.body.lecturer_id) {
        resp.sendStatus(400);
    }
    let b = req.body;
    db = createdb();

    db.run(`INSERT INTO modules (uni_id, module_name, module_code, lecturer_id) VALUES (?,?,?,?)`, [b.uni_id, b.module_name, b.module_code, b.lecturer_id], (err) => {
        if (err) {
            console.error(err);
        } else {
            resp.sendStatus(200);
        }
    });

    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
    });
});

// .run(`CREATE TABLE IF NOT EXISTS modules (
//     module_id INTEGER PRIMARY KEY,
//     uni_id INTEGER NOT NULL,
//     module_name TEXT NOT NULL,
//     module_code TEXT NOT NULL,
//     lecturer_id INTEGER NOT NULL

app.get('/api/survey/:survey_id', function(req, resp) {

    db = createdb();

    db.get(`SELECT survey_formatted FROM surveys WHERE survey_id = ?`, [req.params.survey_id], (err, row) => {
        if (row != undefined) {
            let toR = JSON.parse(unescape(row['survey_formatted']));
            toR['survey_id'] = req.params.survey_id;
            resp.status(200).json(toR);
        } else {
            resp.sendStatus(400);
        }

    });

    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
    });
    // render_template()
});

//List of Modules
app.get('/api/modules', function(req, resp) {
    if (!req.session.user_id) {
        resp.sendStatus(400);
        return;
    }
    db = createdb();
    db.all(`SELECT module_lookup.module_id, modules.module_name, lecturers.name AS module_lecturer, modules.module_code, lecturers.lecturer_id FROM module_lookup INNER JOIN modules ON module_lookup.module_id=modules.module_id INNER JOIN lecturers ON modules.lecturer_id=lecturers.lecturer_id WHERE module_lookup.status = 0 AND module_lookup.user_id = ?`, [req.session.user_id], (err, rows) => {
        modules = [];
        for (let row = 0; row < rows.length; row++) {
            modules.push({'module_id':rows[row].module_id, 'module_name':rows[row].module_name, 'module_lecturer':rows[row].module_lecturer, 'module_code':rows[row].module_code, 'lecturer_id':rows[row].lecturer_id});
        };
        console.log(modules);
        resp.status(200).json(modules);
    });

    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
    });
});

//Individual Module
app.get('/api/module/:module_id', function(req, resp) {
    var result = {}
    db = createdb();
    db.get(`SELECT modules.module_name, lecturers.name AS module_lecturer, modules.module_code FROM modules INNER JOIN lecturers ON modules.lecturer_id=lecturers.lecturer_id WHERE modules.module_id = ?`, [req.params.module_id], (err, row) => {
        if (!row) {
            resp.sendStatus(404);
            return;
        };
        result['module_name'] = row.module_name;
        result['module_lecturer'] = row.module_lecturer;
        result['module_code'] = row.module_code;
        next();
    });
    function next() {
        db.all(`SELECT module_responses.response FROM module_responses WHERE module_id = ?`, [req.params.module_id], (err, rows) => {
            if (!rows) {
                resp.sendStatus(404);
                return;
            };
            var coursework_score = 0;
            var enjoyability_score = 0;
            var difficulty_score = 0;
            for (let row = 0; row < rows.length; row++) {
                let values = rows[row]['response'];
                coursework_score += parseInt(values[1]);
                enjoyability_score += parseInt(values[3]);
                difficulty_score += parseInt(values[5]);
            };
            coursework_score = parseFloat((coursework_score / rows.length).toFixed(1));
            enjoyability_score = parseFloat((enjoyability_score / rows.length).toFixed(1));
            difficulty_score = parseFloat((difficulty_score / rows.length).toFixed(1));
            result['coursework_score'] = coursework_score;
            result['enjoyability_score'] = enjoyability_score;
            result['difficulty_score'] = difficulty_score;
            enext()
        });
        function enext() {
            db.all(`SELECT lecture_responses.response FROM lecture_responses WHERE module_id = ?`, [req.params.module_id], (err, rows) => {
                if (!rows) {
                    resp.sendStatus(404);
                    return;
                };
                var lecture_satisfaction = 0;
                for (let row = 0; row < rows.length; row++) {
                    lecture_satisfaction += parseInt(rows[row]['response']);
                }
                lecture_satisfaction = parseFloat((lecture_satisfaction / rows.length).toFixed(1));
                result['lecture_satisfaction'] = lecture_satisfaction;
                resp.status(200).json(result);
                return;
            });
        }
    }
    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
    });
});

app.get('/api/lecturer/:lecturer_id', function(req, resp) {
    var result = {};
    db = createdb();
    db.get(`SELECT name FROM lecturers WHERE lecturer_id = ?`, [req.params.lecturer_id], (err, row) => {
        if (!row) {
            resp.sendStatus(404);
            return;
        };
        result['lecturer_name'] = row.name;
        next();
        function next() {
            db.all(`SELECT modules.module_id, modules.module_name, modules.module_code FROM modules WHERE modules.lecturer_id = ?`, [req.params.lecturer_id], (err, rows) => {
                if (!rows) {
                    resp.sendStatus(404);
                    return;
                };
                var module_list = [];
                var alreadyadded = [];
                for (let row = 0; row < rows.length; row++) {
                    if (!alreadyadded.includes(rows[row]['module_id'])) {
                        module_list.push({'module_id':rows[row]['module_id'], 'module_name':rows[row]['module_name'], 'module_code':rows[row]['module_code']});
                        alreadyadded.push(rows[row]['module_id']);
                    } 
                };
                result['module_list'] = module_list;
                enext();
                function enext () {
                    db.all(`SELECT module_responses.response FROM modules INNER JOIN module_responses ON module_responses.module_id=modules.module_id WHERE module_responses.module_id = modules.module_id AND modules.lecturer_id = ?`, [req.params.lecturer_id], (err, rows) => {
                        if (!rows) {
                            resp.sendStatus(404);
                            return;
                        };
                        var friendliness_score = 0;
                        var speed_of_response = 0;
                        for (let row = 0; row < rows.length; row++) {
                            let values = rows[row]['response'];
                            friendliness_score += parseInt(values[7]);
                            speed_of_response += parseInt(values[9]);
                        }
                        friendliness_score = parseFloat((friendliness_score / rows.length).toFixed(1));
                        speed_of_response = parseFloat((speed_of_response / rows.length).toFixed(1));
                        result['friendliness_score'] = friendliness_score;
                        result['speed_of_response'] = speed_of_response;
                        resp.status(200).json(result);
                        return;
                    })
                }

        })}
    })
    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
    });
});

app.get('/api/leaderboard', function(req, resp) {
    var users = [];
    db = createdb();
    db.all(`SELECT first_name, last_name, xp FROM users ORDER BY xp DESC`, (err, rows) => {
        if (!rows) {
            resp.sendStatus(400);
            return;
        }
        for (let row = 0; row < rows.length; row++) {
            users.push({'name': rows[row].first_name + " " + rows[row].last_name, 'xp': rows[row].xp});
        }
        resp.status(200).json(users);
    });
    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
    });
});

app.get('/api/getusercards', function(req, resp) {
    var cards = [];
    db = createdb();
    db.all(`SELECT cards.card_id, card_rarity, module_id, module_name, module_code FROM card_user INNER JOIN cards ON card_user.card_id=cards.card_id WHERE card_user.user_id = ?`, [req.session.user_id], (err, rows) => {
        console.log(rows);
        if (!rows) {
            resp.sendStatus(400);
            return;
        }
        for (let row = 0; row < rows.length; row++) {
            cards.push({'card_id': rows[row].card_id, 'card_rarity': rows[row].card_rarity, 'module_id': rows[row].module_id, 'module_name': rows[row].module_name, 'module_code':rows[row].module_code});
        }
        resp.status(200).json(cards);
    });
    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
    });
});

function addTemplate(title, description, target, target_type, questions) {
    let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            return console.error(err.message);
        }
    });

    let structure = {
        "survey_title": title,
        "survey_description": description,
        "target": target,
        "target_type": target_type,
        "questions": questions
    };


    // console.log(`INSERT INTO survey_templates (format) VALUES ("${escape(JSON.stringify(structure))}")`);
    let jsonString = escape(JSON.stringify(structure));
    //console.log(jsonString);
    // db.loadExtension(extPath);

    db.serialize(() => {
        db.run(`INSERT INTO survey_templates (format) VALUES ("${jsonString}")`, err => {
            if (err) {
                console.error(err);
            }
        });
    });

    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
    });
};

app.get('/api/ping', function(req, resp) {
   if (req.session.user_id) {
       resp.json({"id": req.session.user_id, "name": req.session.name, "xp": req.session.xp});
   }
   else {
       resp.sendStatus('440');
   }
});

app.get('/api/logout', function(req, resp) {
    req.session.destroy();
    resp.sendStatus(200);
});

// addTemplate("Regular survey for [module code]", "", "[module_id]", "lecture", ["How much did you enjoy this lecture?", "slider", [1,5,1,"Not at all", "It was amazing!"]]);

module.exports = app;
