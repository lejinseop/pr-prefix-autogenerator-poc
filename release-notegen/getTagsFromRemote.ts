import { graphql } from '@octokit/graphql';

interface OrderBy {
  field: 'TAG_COMMIT_DATE' | 'ALPHABETICAL';
  direction: 'ASC' | 'DESC';
}

interface FilterBy {
  tagname?: string;
}

interface Pagination {
  pageSize: {
    first?: number;
    last?: number;
  };
  page?: {
    before?: number;
    after?: number;
  };
}

interface GetTagsFromRemoteProps {
  filterBy: FilterBy;
  orderBy: OrderBy;
  pagination: Pagination;
}

interface Edge {
  node: {
    name: string;
    target: {
      oid: string;
    };
  };
}
interface GetRefs {
  repository: {
    refs: {
      edges: Edge[];
    };
  };
}

type Tag = Edge;

const TAG_REFS = 'refs/tags/';
const ORG_NAME = 'birdviewdev';
const REPO_NAME = 'fe-monorepo';
const GIT_REPOSITORY_API_TOKEN = process.env.GIT_REPOSITORY_API_TOKEN || '';

const getTagsFromRemote = async ({
  filterBy = {},
  orderBy,
  pagination,
}: GetTagsFromRemoteProps): Promise<Tag[]> => {
  const { repository } = await graphql<GetRefs>(
    `
      query getRefs(
        $owner: String!
        $name: String!
        $refPrefix: String!
        $like: String
        $first: Int
        $last: Int
        $before: String
        $after: String
        $field: RefOrderField!
        $direction: OrderDirection!
      ) {
        repository(owner: $owner, name: $name) {
          refs(
            refPrefix: $refPrefix
            first: $first
            last: $last
            before: $before
            after: $after
            query: $like
            orderBy: { field: $field, direction: $direction }
          ) {
            edges {
              node {
                name
                target {
                  oid
                }
              }
            }
          }
        }
      }
    `,
    {
      headers: {
        authorization: `token ${GIT_REPOSITORY_API_TOKEN}`,
      },
      owner: ORG_NAME,
      name: REPO_NAME,
      refPrefix: TAG_REFS,
      like: filterBy.tagname,
      first: pagination.pageSize?.first,
      last: pagination.pageSize?.last,
      before: pagination.page?.before,
      after: pagination.page?.after,
      field: orderBy.field,
      direction: orderBy.direction,
    },
  );

  return repository.refs.edges;
};

export default getTagsFromRemote;
