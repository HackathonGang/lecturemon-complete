INSERT INTO unis (extension, name) VALUES ("warwick.ac.uk", "The University of Warwick");
INSERT INTO unis (extension, name) VALUES ("durham.ac.uk", "Durham University");

INSERT INTO lecturers (name) VALUES ("Matthew Leeke");
INSERT INTO lecturers (name) VALUES ("Michael Gale");

INSERT INTO modules (uni_id, module_code, lecturer_id, module_name) VALUES (1, "CS132", 1, "Computer Organisation & Architecture");
INSERT INTO modules (uni_id, module_code, lecturer_id, module_name) VALUES (1, "CS141", 2, "Functional Programming");

INSERT INTO lectures (module_id, start_date_time, end_date_time) VALUES (1, 1614686400, 1614690000);

INSERT INTO module_lookup (user_id, module_id, status) VALUES (1, 1, 0);
INSERT INTO module_lookup (user_id, module_id, status) VALUES (1, 2, 0);

INSERT INTO users (first_name, last_name, uni_email, contact_email, password) VALUES ("Ben", "Dover", "Michal.Gagala@warwick.ac.uk", "michal.gagala57@gmail.com", "$2b$10$qohOTVa2Tx2j.zD5cgFYLO9wyvqARBqRDEhoO7GTxLzm7ZqCPDzG2");
INSERT INTO surveys_sent (survey_id, user_id, sent) VALUES (1, 1, 0);
INSERT INTO surveys (survey_template, date_time) VALUES (1, 0);
INSERT INTO survey_templates (format) VALUES ("%7B%22survey_title%22%3A%22Weekly%20survey%20concerning%20CS132%22%2C%22description%22%3A%22Let%27s%20see%20what%20you%20thought%21%22%2C%22target%22%3A1%2C%22target_type%22%3A%22module%22%2C%22questions%22%3A%5B%7B%22title%22%3A%22What%20things%20must%20be%20improved%3F%22%2C%22type%22%3A%22checkbox%22%2C%22options%22%3A%5B%22speed%22%2C%22difficulty%22%2C%22length%22%5D%7D%2C%7B%22title%22%3A%22How%20satisfied%20are%20you%3F%22%2C%22type%22%3A%22slider%22%2C%22options%22%3A%5B%22very%20unsatisfied%22%2C%22very%20satisfied%22%5D%7D%2C%7B%22title%22%3A%22Final%20thoughts%3F%22%2C%22type%22%3A%22text%22%2C%22options%22%3A%5B%5D%7D%5D%7D");

INSERT INTO lecture_responses (response_id, module_id, lecture_id, survey_id, response) VALUES (1, 1, 1, 1, "2");
INSERT INTO lecture_responses (response_id, module_id, lecture_id, survey_id, response) VALUES (2, 1, 1, 1, "4");
INSERT INTO lecture_responses (response_id, module_id, lecture_id, survey_id, response) VALUES (3, 1, 2, 1, "5");

INSERT INTO module_responses (response_id, module_id, survey_id, response) VALUES (1, 1, 1, "[5,1,5,3,4]");
INSERT INTO module_responses (response_id, module_id, survey_id, response) VALUES (2, 1, 1, "[3,2,5,2,1]");

INSERT INTO cards (card_rarity, module_id, module_name, module_code, name) VALUES (1, 1, 'Wow', 'C2f2f', 'Big Card');
INSERT INTO cards (card_rarity, module_id, module_name, module_code, name) VALUES (2, 1, 'Wow', 'C2f2f', 'Big Card');

INSERT INTO card_user (user_id, card_id) VALUES (1, 1);
INSERT INTO card_user (user_id, card_id) VALUES (1, 2);