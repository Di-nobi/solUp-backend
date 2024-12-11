import { Document, Model, PopulateOptions, QueryOptions } from 'mongoose';

// a pagination utility function
export interface PaginationResult<T> {
  data: T[]; // Array of paginated items
  metadata: {
    totalItems: number; // Total number of items
    totalPages: number; // Total number of pages
    currentPage: number; // Current page number
    limit: number; // Number of items per page
  };
}

export async function paginate<T extends Document>(
  model: Model<T>,
  query: QueryOptions,
  limit: number,
  page: number,
  populate?: PopulateOptions | PopulateOptions[] // Accept populate options
): Promise<PaginationResult<T>> {
  const offset = (page - 1) * limit;
  const [data, totalItems] = await Promise.all([
    model.find(query).skip(offset).limit(limit).populate(populate || []).exec(),
    model.countDocuments(query).exec(),
  ]);

  const totalPages = Math.ceil(totalItems / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return {
    data,
    metadata: {
      totalItems,
      totalPages,
      currentPage,
      limit,
    },
  };
}