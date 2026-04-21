const { Op } = require("sequelize");
const { Product, Category, Tag } = require("../model");

const ALLOWED_SORT_BY = ["created_at", "price", "name", "stock"];
const ALLOWED_SORT_ORDER = ["ASC", "DESC"];

const productIncludes = [
  { model: Category, as: "category", attributes: ["id", "name"] },
  { model: Tag, as: "tags", attributes: ["id", "name"], through: { attributes: [] } },
];

const productService = {
  async create(data) {
    return await Product.create(data);
  },

  async findAll(query = {}) {
    const {
      page = 1,
      limit = 10,
      category_id,
      category_ids,
      status,
      brand,
      tag,
      tag_id,
      tag_ids,
      search,
      min_price,
      max_price,
      start_date,
      end_date,
      sort_by = "created_at",
      sort_order = "DESC",
    } = query;

    const offset = (page - 1) * limit;
    const where = {};

    const categoryList = category_ids ? String(category_ids).split(",").filter(Boolean) : null;
    if (categoryList && categoryList.length > 0) {
      where.category_id = { [Op.in]: categoryList };
    } else if (category_id) {
      where.category_id = category_id;
    }
    if (status) where.status = status;
    if (brand) where.brand = brand;

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    if (min_price || max_price) {
      where.price = {};
      if (min_price) where.price[Op.gte] = min_price;
      if (max_price) where.price[Op.lte] = max_price;
    }

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const safeSortBy = ALLOWED_SORT_BY.includes(sort_by) ? sort_by : "created_at";
    const safeSortOrder = ALLOWED_SORT_ORDER.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : "DESC";

    const tagList = tag_ids ? String(tag_ids).split(",").filter(Boolean) : null;
    const tagFilter = tagList && tagList.length > 0
      ? { id: { [Op.in]: tagList } }
      : tag_id
        ? { id: tag_id }
        : tag
          ? { name: tag }
          : null;

    const includes = [
      { model: Category, as: "category", attributes: ["id", "name"] },
      {
        model: Tag,
        as: "tags",
        attributes: ["id", "name"],
        through: { attributes: [] },
        ...(tagFilter ? { where: tagFilter, required: true } : {}),
      },
    ];

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: includes,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[safeSortBy, safeSortOrder]],
      distinct: true,
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  },

  async findById(id) {
    return await Product.findByPk(id, { include: productIncludes });
  },

  async update(id, data) {
    const record = await Product.findByPk(id);
    if (!record) return null;
    return await record.update(data);
  },

  async delete(id) {
    const record = await Product.findByPk(id);
    if (!record) return null;
    await record.destroy();
    return record;
  },

  async addTags(id, tagIds) {
    const product = await Product.findByPk(id);
    if (!product) return null;
    await product.addTags(tagIds);
    return await Product.findByPk(id, { include: productIncludes });
  },

  async removeTags(id, tagIds) {
    const product = await Product.findByPk(id);
    if (!product) return null;
    await product.removeTags(tagIds);
    return await Product.findByPk(id, { include: productIncludes });
  },
};

module.exports = productService;
