import { promisify } from 'util';
import childProcess from 'child_process';

const exec = promisify(childProcess.exec);

type GetTagID = (tag: string) => Promise<string>;

const getTagID: GetTagID = async (tag) => {
    const { stdout: tagID } = await exec(
        [`git`, `rev-parse`, tag].join(' '),
    );
    return tagID;
}

export default getTagID;
