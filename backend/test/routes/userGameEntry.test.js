const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const User = require('../../src/models/users');
const List = require('../../src/models/list');
const Game = require('../../src/models/games');
const GameUserEntry = require('../../src/models/gameUserEntry');
const { createVerifiedUser } = require('../testUtils/authHelper');

let userA, tokenA, userB, tokenB;

beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    ({ user: userA, token: tokenA } = await createVerifiedUser());
    ({ user: userB, token: tokenB } = await createVerifiedUser());
});

afterAll(async () => {
    await List.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await GameUserEntry.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    await mongoose.connection.close();
});

describe('User game entry routes', () => {
    it('rejects requests with no auth token', async () => {
        const res = await request(app).get('/api/user-game-entries/collection');
        expect(res.statusCode).toBe(401);
    });

    describe('POST /api/user-game-entries', () => {
        it('rejects a malformed game ID', async () => {
            const res = await request(app)
                .post('/api/user-game-entries')
                .set('Authorization', `Bearer ${tokenA}`)
                .send({ gameId: 'not-a-valid-id' });

            expect(res.statusCode).toBe(400);
        });

        it('rejects listIds that are not an array', async () => {
            const game = await Game.create({ name: 'Listless', source: 'manual' });

            const res = await request(app)
                .post('/api/user-game-entries')
                .set('Authorization', `Bearer ${tokenA}`)
                .send({ gameId: game._id.toString(), listIds: 'nope' });

            expect(res.statusCode).toBe(400);
        });

        it('returns 404 for a game that does not exist', async () => {
            const fakeGameId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .post('/api/user-game-entries')
                .set('Authorization', `Bearer ${tokenA}`)
                .send({ gameId: fakeGameId.toString() });

            expect(res.statusCode).toBe(404);
        });

        it('returns 404 when a listId does not belong to the requesting user', async () => {
            const game = await Game.create({ name: 'Foreign List Game', source: 'manual' });
            const foreignList = await List.create({ userId: userB._id, name: 'Not Yours' });

            const res = await request(app)
                .post('/api/user-game-entries')
                .set('Authorization', `Bearer ${tokenA}`)
                .send({ gameId: game._id.toString(), listIds: [foreignList._id.toString()] });

            expect(res.statusCode).toBe(404);
        });

        it('creates an entry and populates the game', async () => {
            const game = await Game.create({ name: 'Freshly Played', source: 'manual' });

            const res = await request(app)
                .post('/api/user-game-entries')
                .set('Authorization', `Bearer ${tokenA}`)
                .send({ gameId: game._id.toString(), played: true, rating: 4 });

            expect(res.statusCode).toBe(201);
            expect(res.body.entry.gameId.name).toBe('Freshly Played');
            expect(res.body.entry.rating).toBe(4);
        });

        it('rejects a duplicate entry for the same game', async () => {
            const game = await Game.create({ name: 'Already Owned', source: 'manual' });
            await GameUserEntry.create({ userId: userA._id, gameId: game._id });

            const res = await request(app)
                .post('/api/user-game-entries')
                .set('Authorization', `Bearer ${tokenA}`)
                .send({ gameId: game._id.toString() });

            expect(res.statusCode).toBe(409);
            expect(res.body.entryId).toBeDefined();
        });

        it('rejects an out-of-range rating (schema validation)', async () => {
            const game = await Game.create({ name: 'Bad Rating Game', source: 'manual' });

            const res = await request(app)
                .post('/api/user-game-entries')
                .set('Authorization', `Bearer ${tokenA}`)
                .send({ gameId: game._id.toString(), rating: 99 });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('GET /api/user-game-entries/collection', () => {
        it('only returns the requesting user\'s own entries', async () => {
            const game = await Game.create({ name: 'UserB Game', source: 'manual' });
            await GameUserEntry.create({ userId: userB._id, gameId: game._id });

            const res = await request(app)
                .get('/api/user-game-entries/collection')
                .set('Authorization', `Bearer ${tokenA}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.every((entry) => entry.gameId?.name !== 'UserB Game')).toBe(true);
        });
    });

    describe('GET /api/user-game-entries/collection/:entryId', () => {
        it('rejects a malformed entry ID', async () => {
            const res = await request(app)
                .get('/api/user-game-entries/collection/not-a-valid-id')
                .set('Authorization', `Bearer ${tokenA}`);

            expect(res.statusCode).toBe(400);
        });

        it('returns 404 for an entry owned by another user', async () => {
            const game = await Game.create({ name: 'Not Yours To View', source: 'manual' });
            const entry = await GameUserEntry.create({ userId: userB._id, gameId: game._id });

            const res = await request(app)
                .get(`/api/user-game-entries/collection/${entry._id}`)
                .set('Authorization', `Bearer ${tokenA}`);

            expect(res.statusCode).toBe(404);
        });

        it('returns the entry when it belongs to the requesting user', async () => {
            const game = await Game.create({ name: 'Viewable Game', source: 'manual' });
            const entry = await GameUserEntry.create({ userId: userA._id, gameId: game._id });

            const res = await request(app)
                .get(`/api/user-game-entries/collection/${entry._id}`)
                .set('Authorization', `Bearer ${tokenA}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.gameId.name).toBe('Viewable Game');
        });
    });

    describe('PATCH /api/user-game-entries/collection/:entryId', () => {
        it('rejects a request with no valid fields', async () => {
            const game = await Game.create({ name: 'Unpatchable', source: 'manual' });
            const entry = await GameUserEntry.create({ userId: userA._id, gameId: game._id });

            const res = await request(app)
                .patch(`/api/user-game-entries/collection/${entry._id}`)
                .set('Authorization', `Bearer ${tokenA}`)
                .send({ notARealField: 'ignored' });

            expect(res.statusCode).toBe(400);
        });

        it('returns 404 for an entry owned by another user', async () => {
            const game = await Game.create({ name: 'Not Yours To Patch', source: 'manual' });
            const entry = await GameUserEntry.create({ userId: userB._id, gameId: game._id });

            const res = await request(app)
                .patch(`/api/user-game-entries/collection/${entry._id}`)
                .set('Authorization', `Bearer ${tokenA}`)
                .send({ hoursPlayed: 5 });

            expect(res.statusCode).toBe(404);
        });

        it('updates allowed fields on the requesting user\'s entry', async () => {
            const game = await Game.create({ name: 'Patchable', source: 'manual' });
            const entry = await GameUserEntry.create({ userId: userA._id, gameId: game._id });

            const res = await request(app)
                .patch(`/api/user-game-entries/collection/${entry._id}`)
                .set('Authorization', `Bearer ${tokenA}`)
                .send({ hoursPlayed: 12, played: true, rating: 5 });

            expect(res.statusCode).toBe(200);
            expect(res.body.entry.hoursPlayed).toBe(12);
            expect(res.body.entry.rating).toBe(5);
        });
    });

    describe('DELETE /api/user-game-entries/:entryId', () => {
        it('rejects a malformed entry ID', async () => {
            const res = await request(app)
                .delete('/api/user-game-entries/not-a-valid-id')
                .set('Authorization', `Bearer ${tokenA}`);

            expect(res.statusCode).toBe(400);
        });

        it('returns 404 for an entry owned by another user', async () => {
            const game = await Game.create({ name: 'Not Yours To Delete', source: 'manual' });
            const entry = await GameUserEntry.create({ userId: userB._id, gameId: game._id });

            const res = await request(app)
                .delete(`/api/user-game-entries/${entry._id}`)
                .set('Authorization', `Bearer ${tokenA}`);

            expect(res.statusCode).toBe(404);
        });

        it('deletes the requesting user\'s own entry', async () => {
            const game = await Game.create({ name: 'Deletable Entry', source: 'manual' });
            const entry = await GameUserEntry.create({ userId: userA._id, gameId: game._id });

            const res = await request(app)
                .delete(`/api/user-game-entries/${entry._id}`)
                .set('Authorization', `Bearer ${tokenA}`);

            expect(res.statusCode).toBe(200);

            const deletedEntry = await GameUserEntry.findById(entry._id);
            expect(deletedEntry).toBeNull();
        });
    });

    describe('POST /api/user-game-entries/lists/:listId/games/:gameId', () => {
        it('returns 404 when the list does not belong to the requesting user', async () => {
            const game = await Game.create({ name: 'Addable Game', source: 'manual' });
            const foreignList = await List.create({ userId: userB._id, name: 'Foreign List' });

            const res = await request(app)
                .post(`/api/user-game-entries/lists/${foreignList._id}/games/${game._id}`)
                .set('Authorization', `Bearer ${tokenA}`);

            expect(res.statusCode).toBe(404);
        });

        it('returns 404 when the game does not exist', async () => {
            const list = await List.create({ userId: userA._id, name: 'Real List' });
            const fakeGameId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .post(`/api/user-game-entries/lists/${list._id}/games/${fakeGameId}`)
                .set('Authorization', `Bearer ${tokenA}`);

            expect(res.statusCode).toBe(404);
        });

        it('creates a new entry (upsert) and adds the list when none existed yet', async () => {
            const list = await List.create({ userId: userA._id, name: 'Upsert List' });
            const game = await Game.create({ name: 'Upsert Game', source: 'manual' });

            const res = await request(app)
                .post(`/api/user-game-entries/lists/${list._id}/games/${game._id}`)
                .set('Authorization', `Bearer ${tokenA}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.entry.listIds.map(String)).toContain(list._id.toString());
        });

        it('adds the list to an existing entry without duplicating it', async () => {
            const list = await List.create({ userId: userA._id, name: 'Existing Entry List' });
            const game = await Game.create({ name: 'Existing Entry Game', source: 'manual' });
            await GameUserEntry.create({ userId: userA._id, gameId: game._id });

            await request(app)
                .post(`/api/user-game-entries/lists/${list._id}/games/${game._id}`)
                .set('Authorization', `Bearer ${tokenA}`);
            const res = await request(app)
                .post(`/api/user-game-entries/lists/${list._id}/games/${game._id}`)
                .set('Authorization', `Bearer ${tokenA}`);

            expect(res.statusCode).toBe(200);
            const listIdCount = res.body.entry.listIds.filter(
                (id) => String(id) === list._id.toString()
            ).length;
            expect(listIdCount).toBe(1);
        });
    });

    describe('DELETE /api/user-game-entries/lists/:listId/games/:gameId', () => {
        it('returns 404 when the entry is not in that list', async () => {
            const list = await List.create({ userId: userA._id, name: 'Empty List' });
            const game = await Game.create({ name: 'Not In List', source: 'manual' });
            await GameUserEntry.create({ userId: userA._id, gameId: game._id });

            const res = await request(app)
                .delete(`/api/user-game-entries/lists/${list._id}/games/${game._id}`)
                .set('Authorization', `Bearer ${tokenA}`);

            expect(res.statusCode).toBe(404);
        });

        it('removes the list from the entry', async () => {
            const list = await List.create({ userId: userA._id, name: 'Removable List' });
            const game = await Game.create({ name: 'In A Removable List', source: 'manual' });
            await GameUserEntry.create({ userId: userA._id, gameId: game._id, listIds: [list._id] });

            const res = await request(app)
                .delete(`/api/user-game-entries/lists/${list._id}/games/${game._id}`)
                .set('Authorization', `Bearer ${tokenA}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.entry.listIds.map(String)).not.toContain(list._id.toString());
        });
    });
});
