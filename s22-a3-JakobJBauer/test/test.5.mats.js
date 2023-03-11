import { expectStatus, expectBodyJSON, expectEquality } from './jest-tuwien';
import { testApp, sendRequest } from './util';

describe('/mats', () => {

  testApp(501, 'Mat colors', async (steps) => {
    const res = await sendRequest(steps, { path: '/mats' } );
    expectStatus(steps, res, 200);
    const body = expectBodyJSON(steps, res);
    steps.push('expect response to contain the correct mat colors');
    expectEquality(body, [
        { color: "cream", label: "Cream", hex: "#d4ffea" },
        { color: "carla", label: "Carla", hex: "#F5F8CF" },
        { color: "glacier", label: "Glacier", hex: "#78B1BF" },
        { color: "pacific", label: "Pacific", hex: "#006666" },
        { color: "seal", label: "Seal", hex: "#2A1212" }
    ]);
  });

});
