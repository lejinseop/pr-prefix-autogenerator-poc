import { promisify } from 'util';
import childProcess from 'child_process';

const exec = promisify(childProcess.exec);

type OrderBy = 'desc' | 'asc';

const ORDER_BY_OPTION_MAP: Record<OrderBy, string> = {
  desc: '--sort=-v:refname',
  asc: '--sort=v:refname',
};

interface GetTagsOptions {
  filter?: string;
  orderBy?: OrderBy;
}

type GetTags = (options: GetTagsOptions) => Promise<string[]>;

const getTags: GetTags = async ({ filter, orderBy = 'asc' }) => {
  const { stdout: tagsString } = await exec(
    [`git`, `tag`, `-l`, ...(filter ? [filter] : []), ORDER_BY_OPTION_MAP[orderBy]].join(' '),
  );

  return tagsString?.split('\n') || [];
};

export default getTags;
