const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const { Thread, Reply } = require('../database/models.js')

chai.use(chaiHttp);

let testBoard = "testBoard369";
let testText = "test Text 369";
let testValidPassword = "test";
let testInvalidPassword = "bagholder"
let testThread;
let testReply;

suite('Functional Tests', function() {
    suite(`/api/threads/${testBoard}`, function() {
        test('Creating a new thread', (done) => {
            chai.request(server)
                .post(`/api/threads/${testBoard}`)
                .send({
                    text: testText,
                    delete_password: testValidPassword
                })
                .redirects(1)
                .end(async function (err, res) {                   
                    assert.equal(res.status, 200, 'good response should be 200');
                    assert.equal(res.req.path, `/b/${testBoard}`, 'should redirect to correct path');
                    const thread = await Thread.findOne({ board: testBoard, text: testText, delete_password: testValidPassword });
                    assert.isNotNull(thread, 'should exist');
                    assert.equal(thread.board, testBoard, 'should match');
                    assert.equal(thread.text, testText, 'should  match');
                    assert.equal(thread.delete_password, testValidPassword, 'should match');
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
                .get(`/api/threads/${testBoard}`)
                .end(function (err, res) {
                    assert.equal(res.status, 200);                    
                    assert.equal(res.body.length, 10, 'Only 10 threads');
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
                .put(`/api/threads/${testBoard}`)
                .send({
                    thread_id: testThread._id
                })
                .end(async function (err, res) {
                    assert.equal(res.status, 200);
                    assert.equal(res.text, 'reported');
                    const UpdatedThread = await Thread.findById(testThread._id)
                    assert.isTrue(UpdatedThread.reported, 'should be true');
                    done();
                })
        });
        test('Deleting a thread with the incorrect password', (done) => {
            chai.request(server)
                .delete(`/api/threads/${testBoard}`)
                .send({
                    thread_id: testThread._id,
                    delete_password: testInvalidPassword
                })
                .end(function (err, res) {
                    assert.equal(res.status, 401);
                    assert.equal(res.text, 'incorrect password');
                    done();
                })
        });
    });
    suite(`/api/replies/${testBoard}`, function() {
        test('Creating a new reply', (done) => {
            chai.request(server)
                .post(`/api/replies/${testBoard}`)
                .send({
                    text: testText,
                    delete_password: testValidPassword,
                    thread_id: testThread._id
                })
                .end(async function (err, res) {                   
                    assert.equal(res.status, 200, 'good response should be 200');
                    assert.equal(res.req.path, `/b/${testBoard}/${testThread._id}`, 'should redirect to correct path');
                    const reply = await Reply.findOne({ text: testText, delete_password: testValidPassword });
                    assert.isNotNull(reply, 'should exist');
                    assert.equal(reply.text, testText, 'should  match');
                    assert.equal(reply.delete_password, testValidPassword, 'should match');
                    assert.exists(reply._id, 'should exist');
                    assert.exists(reply.created_on, 'should exist');
                    assert.exists(reply.reported, 'should exist');

                    testReply = reply;
                    done();
                })
        });
        // test('Viewing a single thread with all replies', (done) => {
        //     chai.request(server)
        //         .get(`/api/replies/${testBoard}`)
        //         .query({ thread_id: testThread._id })
        //         .send()
        //         .end(function (err, res) {
                                                           
        //             assert.isObject(res.body);
        //             assert.property(res.body, '_id');
        //             assert.property(res.body, 'text');
        //             assert.property(res.body, 'created_on');
        //             assert.notExists(res.body, 'delete_password');
        //             assert.notExists(res.body, 'reported');
    
                    
        //             assert.isArray(res.body.replies);
        //             done();
        //         })
        // });
        // test('Deleting a reply with the incorrect password', (done) => {
        //     chai.request(server)
        //         .delete(`/api/replies/${testBoard}/${testThread._id}`)
        //         .send({
        //             thread_id: testThread._id,
        //             delete_password: testInvalidPassword,
        //             reply_id: testReply._id
        //         })
        //         .end(function (err, res) {
        //             assert.equal(res.status, 404);
        //             console.log(res.body);
        //             console.log(res.text);
                    
                    
        //             assert.equal(res.text, 'incorrect password');
        //             done();
        //         })
        // });
        // test('Reporting a reply', (done) => {
        //     chai.request(server)
        //         .put(`/api/replies/${testBoard}`)
        //         .send({
        //             thread_id: testThread._id,
        //             reply_id: testReply._id
        //         })
        //         .end(async function (err, res) {
        //             assert.equal(res.status, 200);
        //             assert.equal(res.text, 'reported');
        //             const UpdatedReply = await Reply.findById(testReply._id)
        //             assert.isTrue(UpdatedReply.reported, 'should be true');
        //             done();
        //         })
        // });
    });
    suite('Deletus', function() {
        // suite(`/api/replies/${testBoard}`, function() {
        //     test('Deleting a reply with the correct password', (done) => {
        //         chai.request(server)
        //             .delete(`/api/replies/${testBoard}`)
        //             .send({
        //                 thread_id: testThread._id,
        //                 delete_password: testThread.delete_password,
        //                 reply_id: testReply._id
        //             })
        //             .end(function (err, res) {
        //                 assert.equal(res.status, 200);
        //                 assert.equal(res.text, 'success');
        //                 done();
        //             })
        //     });
        // })
        // suite(`/api/threads/${testBoard}`, function() {
        //     test('Deleting a thread with the correct password', (done) => {
        //         chai.request(server)
        //             .delete(`/api/threads/${testBoard}`)
        //             .send({
        //                 thread_id: testThread._id,
        //                 delete_password: testThread.delete_password
        //             })
        //             .end(function (err, res) {
        //                 assert.equal(res.status, 200);
        //                 assert.equal(res.text, 'success');
        //                 done();
        //             })
        //     });
        // })
    })
});
