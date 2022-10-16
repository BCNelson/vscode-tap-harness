import { AssertData, AssertNode, ChildNode, Node } from 'tap-parser';
import { TestCase } from './TestCase';

export function reorderNodes(nodes: Node[]): Node[] {
    const ret: Node[] = [];
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i][0] === 'child') {
            ret.push(nodes[i + 1]);
            ret.push(nodes[i]);
            i++;
        }else {
            ret.push(nodes[i]);
        }
    }
    return ret;
}

export function nodeArrayToTestCaseArray(nodes: Node[], parentId?: string): TestCase[] {
    const relevantNodes = nodes.filter(n => n[0] === 'assert' || n[0] === 'child') as (AssertNode | ChildNode)[];

    const ret: TestCase[] = [];

    for (let i = 0; i < relevantNodes.length; i++) {
        let assertData: AssertData;
        switch (relevantNodes[i][0]) {
            case 'assert':
                assertData = relevantNodes[i][1] as AssertData;
                if (assertData.id === undefined) {
                    assertData.id = i+1;
                }
                ret.push(new TestCase(relevantNodes[i][1] as AssertData, parentId));
                break;
            case 'child':
                const nextNode = relevantNodes[i + 1];
                if (nextNode === undefined || nextNode[0] !== 'assert') {
                    throw Error("Unexpected Node type following a child - should be Assert");
                }
                assertData = nextNode[1] as AssertData;
                if (assertData.id === undefined) {
                    assertData.id = i+1;
                }
                const testCase = new TestCase(assertData, parentId);
                testCase.addChildren(relevantNodes[i][1] as Node[]);
                ret.push(testCase);
                i++; // skip the next assert
                break;
            default:
                throw new Error("");
        }
    }
    return ret;
}