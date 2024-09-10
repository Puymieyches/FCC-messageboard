const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = chai.assert;
const server = require('../server');
const { Thread, Reply } = require('../database/models.js')

chai.use(chaiHttp);

suite('Functional Tests', function() {

    let testThread;
    let testReply;

    test('Create a new thread', (done) => {
        chai.request(server)
            .post(`/api/threads/chaitest123`)
            .send({
                text: "Something as text",
                delete_password: "valid password"
            })
            .redirects(1)
            .end(async function (err, res) {                   
                assert.equal(res.status, 200, 'good response should be 200');
                assert.equal(res.req.path, `/b/chaitest123`, 'should redirect to correct path');
                const thread = await Thread.findOne({ board: "chaitest123", text: "Something as text", delete_password: "valid password" });
                assert.isNotNull(thread, 'should exist');
                assert.equal(thread.board, "chaitest123", 'should match');
                assert.equal(thread.text, "Something as text", 'should  match');
                assert.equal(thread.delete_password, "valid password", 'should match');
                assert.exists(thread._id, 'should exist');
                assert.exists(thread.created_on, 'should exist');
                assert.exists(thread.reported, 'should exist');
                assert.exists(thread.bumped_on, 'should exist');
                assert.exists(thread.replies, 'should exist');
                assert.isArray(thread.replies, 'should be array');
                testThread = thread;
                done();
            })
    });
    test('Viewing the 10 most recent threads with 3 replies each', (done) => {
        chai.request(server)
            .get(`/api/threads/chaitest123`)
            .end(function (err, res) {
                assert.equal(res.status, 200);                    
                assert.isAtMost(res.body.length, 10, 'Only 10 threads max');
                res.body.forEach(thread => {
                    assert.notExists(thread.reported, 'no reported property');
                    assert.notExists(thread.delete_password,'no password');

                    assert.isAtMost(thread.replies.length, 3, 'no more than 3 replies');

                    thread.replies.forEach(reply => {
                        assert.notExists(reply.reported, 'no reported property for repply');
                        assert.notExists(reply.delete_password, 'no password for reply');
                    })
                })
                done();
            })
    });
    test('Reporting a thread', (done) => {
        chai.request(server)
            .put(`/api/threads/chaitest123`)
            .send({
                thread_id: testThread._id
            })
            .end(async function (err, res) {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'reported');
                let UpdatedThread = await Thread.findById(testThread._id)
                assert.isTrue(UpdatedThread.reported, 'should be true');
                done();
            })
    });
    test('Deleting a thread with the incorrect password', (done) => {
        chai.request(server)
            .delete(`/api/threads/chaitest123`)
            .send({
                thread_id: testThread._id,
                delete_password: "invalid password"
            })
            .end(function (err, res) {
                assert.equal(res.status, 401);
                assert.equal(res.text, 'incorrect password');
                done();
            })
    });
    test('Creating a new reply', (done) => {
        chai.request(server)
            .post(`/api/replies/chaitest123`)
            .send({
                text: "Something as text",
                delete_password: "valid password reply",
                thread_id: testThread._id
            })
            .end(async function (err, res) {                   
                assert.equal(res.status, 200, 'good response should be 200');
                assert.equal(res.req.path, `/b/chaitest123/${testThread._id}`, 'should redirect to correct path');
                const reply = await Reply.findOne({ text: "Something as text", delete_password: "valid password reply" });
                assert.isNotNull(reply, 'should exist');
                assert.equal(reply.text, "Something as text", 'should  match');
                assert.equal(reply.delete_password, "valid password reply", 'should match');
                assert.exists(reply._id, 'should exist');
                assert.exists(reply.created_on, 'should exist');
                assert.exists(reply.reported, 'should exist');                                
                let updatedThread = await Thread.findById(testThread._id);
                testThread = updatedThread;
                testReply = reply;                
                done();
            })
    });
    test('Viewing a single thread with all replies', (done) => {
        chai.request(server)
            .get(`/api/replies/chaitest123`)
            .query({ thread_id: testThread._id.toString() })
            .send()
            .end(function (err, res) {                
                assert.equal(res.status, 200);                                         
                assert.isObject(res.body);

                assert.property(res.body, '_id', 'Thread should have _id');
                assert.property(res.body, 'text', 'Thread should have text');
                assert.property(res.body, 'created_on', 'Thread should have a created_on date');
                assert.notProperty(res.body, 'delete_password', 'Thread should not include delete_password');
                assert.notProperty(res.body, 'reported', 'Thread should not include reported');
                
                 // Assert that replies are returned as an array
                assert.isArray(res.body.replies, 'Thread should have replies as an array');
                
                // Check each reply object to ensure certain fields exist and others are excluded
                res.body.replies.forEach(reply => {
                    assert.property(reply, '_id', 'Reply should have _id');
                    assert.property(reply, 'text', 'Reply should have text');
                    assert.property(reply, 'created_on', 'Reply should have created_on date');

                    // Ensure sensitive fields are excluded
                    assert.notProperty(reply, 'delete_password', 'Reply should not include delete_password');
                    assert.notProperty(reply, 'reported', 'Reply should not include reported');
                });
                
                done();
            })
    });
    test('Reporting a reply', (done) => {
        chai.request(server)
            .put(`/api/replies/chaitest123`)
            .send({
                thread_id: testThread._id,
                reply_id: testReply._id
            })
            .end(async function (err, res) {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'reported');
                const UpdatedThread = await Thread.findById(testThread._id)
                const UpdatedReply = UpdatedThread.replies.id(testReply._id);                
                assert.isTrue(UpdatedReply.reported, 'should be true');
                done();
            })
    });
    test('Deleting a reply with the incorrect password', (done) => {
        chai.request(server)
            .delete(`/api/replies/chaitest123`)
            .send({
                thread_id: testThread._id,
                delete_password: "invalid password",
                reply_id: testReply._id
            })
            .end(function (err, res) {
                assert.equal(res.status, 401);
                assert.equal(res.text, 'incorrect password');
                done();
            })
    });
    test('Deleting a reply with the correct password', (done) => {
        chai.request(server)
            .delete(`/api/replies/chaitest123`)
            .send({
                thread_id: testThread._id,
                delete_password: "valid password reply",
                reply_id: testReply._id
            })
            .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'success');
                done();
            })
    });
    test('Deleting a thread with the correct password', (done) => {
        chai.request(server)
            .delete(`/api/threads/chaitest123`)
            .send({
                thread_id: testThread._id,
                delete_password: "valid password",
            })
            .end(function (err, res) {                               
                assert.equal(res.status, 200);
                assert.equal(res.text, 'success');
                done();
            })
    });
});
