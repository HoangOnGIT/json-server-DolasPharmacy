import { faker } from "@faker-js/faker";
import fs from "fs/promises";
import bcrypt from "bcrypt";
import fetch from "node-fetch"; // You may need to install this: npm install node-fetch

// Helper function to generate unique IDs
const generateId = () => faker.string.uuid();

// Helper function to round to nearest 10,000
const roundToNearest10k = (number) => {
  return Math.round(number / 10000) * 10000;
};

// Helper function to get price range
const getPriceRange = (price) => {
  if (price < 1000000) return "Dưới 1 triệu";
  if (price < 2000000) return "1 triệu - 2 triệu";
  if (price < 3000000) return "2 triệu - 3 triệu";
  if (price < 4000000) return "3 triệu - 4 triệu";
  if (price < 5000000) return "4 triệu - 5 triệu";
  if (price < 10000000) return "5 triệu - 10 triệu";
  if (price < 20000000) return "10 triệu - 20 triệu";
  if (price < 50000000) return "20 triệu - 50 triệu";
  return "Trên 50 triệu";
};

// Array of real product images from Cloudinary to be used for both products and categories
const cloudinaryImages = [
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341495/00021988-anica-phytextra-60v-513_fc7gpe.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341495/00031920-top-grow-jpanwell-10-ch_vogxfu.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341495/00031920-top-grow-jpanwell-10-ch_1_a0fqlp.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341495/00031036-omexxel-ginkgo-120-2x15_hx0z2x.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341494/00029929-maxpremum-naga-plus-200_uu8e9w.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341494/00030869-sasagold-saffron-nhuy-h_btbsu0.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341489/img-9003-7e22ddc19e_1_czsgxg.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341489/dsc-09932-bc701e2141_y7evhl.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341489/dsc-09866-48ad7ea252_mf8bzn.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341489/hebe-tuyp-truoc-908f63e863_xzl4jv.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341488/dsc-00535-480fad02f8_1_mxnxvw.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341487/00503275-vien-uong-bo-sung-canxi_qjtovs.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341487/00032817-blood-care-jpanwell-60v_ule2rv.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341487/dsc-00036-f81526ba97_oojjx4.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341487/dsc-00025-00386132d2_ryqm1b.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341487/00502603-vien-uong-tang-cuong-ch_ytdohn.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341486/00503081-sap-duong-am-vaseline-r_xz0dfq.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341485/00503066-son-duong-moi-sebamed-l_iuf3kn.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341485/00032923-vien-uong-cai-thien-tim_m6kd4c.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341485/00502680-vien-uong-lam-dep-da-ch_we06np.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341485/00502416-blackmores-executive-b-4_fsoxxw.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341485/00501988-sua-cho-benh-nhan-gan-f_pyyoou.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341484/00032918-glucosamine-and-chondro_xsbh2t.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341484/00032923-vien-uong-cai-thien-tim_1_b56yqn.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341484/00032884-okinawa-fucoidan-jpanwe_ohmdom.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341483/00031920-top-grow-jpanwell-10-ch-3f81b1a4-df3b-41f3-869d-c64cb90506fa_qble7r.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341483/00500955-tra-nhan-sam-ko-ginseng_a9hd5l.png",
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341483/00500119-vien-uong-ho-tro-giam-n_fyciyl.png",
];

// Generate pharmacy-specific categories
const generatePharmacyCategories = (count) => {
  // Define common pharmacy categories in Vietnamese
  const mainCategories = [
    {
      name: "Thuốc kê đơn",
      description: "Thuốc cần đơn của bác sĩ để mua",
    },
    {
      name: "Thuốc không kê đơn",
      description: "Thuốc có thể mua không cần đơn của bác sĩ",
    },
    {
      name: "Vitamin & Thực phẩm chức năng",
      description: "Sản phẩm bổ sung dinh dưỡng cho sức khỏe và thể chất",
    },
    {
      name: "Chăm sóc cá nhân",
      description: "Sản phẩm vệ sinh và chăm sóc cá nhân",
    },
    {
      name: "Sơ cứu",
      description: "Vật dụng và thiết bị sơ cứu thiết yếu",
    },
    {
      name: "Sức khỏe trẻ em & Trẻ sơ sinh",
      description: "Sản phẩm chăm sóc sức khỏe cho trẻ em và trẻ sơ sinh",
    },
    {
      name: "Hỗ trợ di chuyển & Sinh hoạt",
      description: "Sản phẩm hỗ trợ di chuyển và các hoạt động hàng ngày",
    },
    {
      name: "Chăm sóc da",
      description: "Sản phẩm điều trị và chăm sóc sức khỏe làn da",
    },
    {
      name: "Chăm sóc tiểu đường",
      description: "Vật dụng và thuốc điều trị bệnh tiểu đường",
    },
    {
      name: "Thiết bị y tế",
      description: "Thiết bị theo dõi sức khỏe và y tế",
    },
  ];

  const categories = [];

  for (let i = 0; i < count; i++) {
    const categoryData =
      i < mainCategories.length
        ? mainCategories[i]
        : {
            name: `${faker.commerce.productAdjective()} ${
              faker.science.chemicalElement().name
            }`,
            description: faker.lorem.sentence(),
          };

    const category = {
      id: generateId(),
      name: categoryData.name,
      description: categoryData.description,
      parentId:
        i > 5 && faker.datatype.boolean(0.3)
          ? categories[faker.number.int({ min: 0, max: 4 })].id
          : null,
      image: faker.helpers.arrayElement(cloudinaryImages),
      isActive: faker.datatype.boolean(0.9),
      displayOrder: i + 1,
      metaTitle: categoryData.name,
      metaDescription: categoryData.description.substring(0, 160),
      createdAt: faker.date.past({ years: 1 }).toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    };

    categories.push(category);
  }

  return categories;
};

// Generate pharmaceutical suppliers
const generatePharmacySuppliers = (count) => {
  // Vietnamese-inspired pharmaceutical suppliers
  const pharmaCompanyNames = [
    "Dược phẩm Hà Nội",
    "Công ty Dược phẩm Sài Gòn",
    "Dược phẩm Traphaco",
    "Vimedimex Việt Nam",
    "Dược phẩm Imexpharm",
    "DHG Pharma",
    "OPC Pharma",
    "Dược phẩm Hậu Giang",
    "Pymepharco",
    "Domesco",
    "Dược phẩm Cửu Long",
    "Dược phẩm Nam Hà",
  ];

  const suppliers = [];

  for (let i = 0; i < count; i++) {
    const supplier = {
      id: generateId(),
      name:
        i < pharmaCompanyNames.length
          ? pharmaCompanyNames[i]
          : `Công ty Dược phẩm ${faker.company.name()}`,
      code: faker.string.alphanumeric(6).toUpperCase(),
      contactName: `${faker.person.lastName()} ${faker.person.firstName()}`,
      email: faker.internet.email().toLowerCase(),
      phone: `0${faker.string.numeric(9)}`,
      website: `https://www.${faker.internet.domainWord()}.com.vn`,
      paymentTerms: faker.helpers.arrayElement([
        "Thanh toán ngay",
        "Thanh toán 30 ngày",
        "Thanh toán 60 ngày",
        "Thanh toán 90 ngày",
      ]),
      minOrderValue: faker.number.int({
        min: 1000000,
        max: 50000000,
      }),
      leadTime: faker.number.int({ min: 2, max: 14 }),
      qualityRating: faker.number.float({ min: 3, max: 5, precision: 0.1 }),
      reliabilityScore: faker.number.float({ min: 3, max: 5, precision: 0.1 }),
      active: faker.datatype.boolean(0.9),
      notes: "Công ty cung cấp các sản phẩm dược phẩm chất lượng cao.",
      taxId: faker.string.alphanumeric(10).toUpperCase(),
      createdAt: faker.date.past({ years: 1 }).toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    };

    suppliers.push(supplier);
  }

  return suppliers;
};

// Fetch provinces and districts data from API
const fetchProvincesAndDistricts = async () => {
  try {
    const [provincesResponse, districtsResponse] = await Promise.all([
      fetch("https://provinces.open-api.vn/api/p"),
      fetch("https://provinces.open-api.vn/api/d")
    ]);
    
    const provinces = await provincesResponse.json();
    const districts = await districtsResponse.json();
    
    return {
      provinces: provinces.map(p => ({ id: p.code, name: p.name })),
      districts: districts.map(d => ({ id: d.code, name: d.name, provinceId: d.province_code }))
    };
  } catch (error) {
    console.error("Failed to fetch provinces/districts:", error);
    // Fallback to some default data if API fails
    return {
      provinces: [{ id: 1, name: "Tỉnh Hà Nội" }, { id: 2, name: "Tỉnh TP. Hồ Chí Minh" }],
      districts: [{ id: 1, name: "Quận Hoàn Kiếm", provinceId: 1 }, { id: 2, name: "Quận 1", provinceId: 2 }]
    };
  }
};

// Generate pharmacy users with Vietnamese names and locations
const generatePharmacyUsers = async (count) => {
  const users = [];
  const carts = []; // Initialize carts array
  const favourites = []; // Initialize favourites array
  
  // Fetch provinces and districts from API
  const { provinces, districts } = await fetchProvincesAndDistricts();

  // Always add admin user first
  const adminUser = {
    id: generateId(),
    email: "admin@gmail.com",
    passwordHash: await bcrypt.hash("admin", 10), // Hash the admin password
    firstName: "Admin",
    lastName: "User",
    phone: "0987654321",
    dateOfBirth: "1990-01-01",
    role: "admin",
    verificationStatus: "verified",
    lastLogin: faker.date.recent().toISOString(),
    addresses: [
      {
        type: "shipping",
        isPrimary: true,
        street: "123",
        city: provinces.length > 0 ? provinces[0].name : "Tỉnh Hà Giang",
        state: districts.length > 0 ? districts[0].name : "Quận Hoàn Kiếm",
        country: "Việt Nam",
        phone: "0987654321",
      },
    ],
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    updatedAt: faker.date.recent().toISOString(),
  };

  users.push(adminUser);

  // Generate a cart for the admin user
  carts.push({
    id: generateId(),
    userId: adminUser.id,
    items: [],
    createdAt: faker.date.past({ years: 1 }).toISOString(),
    updatedAt: faker.date.recent().toISOString(),
  });

  // Generate a favourites list for the admin user
  favourites.push({
    id: generateId(),
    userId: adminUser.id,
    items: [],
    createdAt: faker.date.past({ years: 1 }).toISOString(),
    updatedAt: faker.date.recent().toISOString(),
  });

  const vietnameseLastNames = [
    "Nguyễn",
    "Trần",
    "Lê",
    "Phạm",
    "Hoàng",
    "Huỳnh",
    "Phan",
    "Vũ",
    "Võ",
    "Đặng",
    "Bùi",
    "Đỗ",
    "Hồ",
    "Ngô",
    "Dương",
    "Lý",
  ];

  const vietnameseFirstNames = [
    "Anh",
    "Bảo",
    "Cường",
    "Dũng",
    "Đức",
    "Hà",
    "Hải",
    "Hoàng",
    "Hùng",
    "Huy",
    "Lan",
    "Linh",
    "Mai",
    "Minh",
    "Nam",
    "Ngọc",
    "Phương",
    "Quân",
    "Thảo",
    "Tuấn",
    "Vy",
  ];

  for (let i = 0; i < count - 1; i++) {
    // Reduced count by 1 since we already added admin
    const lastName = faker.helpers.arrayElement(vietnameseLastNames);
    const firstName = faker.helpers.arrayElement(vietnameseFirstNames);
    const fullName = `${lastName} ${firstName}`;

    // Get random province and district
    const province = faker.helpers.arrayElement(provinces);
    // Get districts that belong to the selected province, or any district if relation not found
    const matchingDistricts = districts.filter(d => d.provinceId === province.id);
    const district = matchingDistricts.length > 0 
      ? faker.helpers.arrayElement(matchingDistricts) 
      : faker.helpers.arrayElement(districts);

    const role = faker.helpers.arrayElement([
      "customer",
      "customer",
      "customer",
      "staff",
      "guest",
    ]);

    const user = {
      id: generateId(),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${faker.number.int(
        999
      )}@gmail.com`,
      passwordHash: await bcrypt.hash(
        faker.internet.password({ length: 12 }),
        10
      ),
      firstName: firstName,
      lastName: lastName,
      phone: `0${faker.string.numeric(9)}`,
      dateOfBirth: faker.date
        .birthdate({ min: 18, max: 90, mode: "age" })
        .toISOString()
        .split("T")[0],
      role: role,
      verificationStatus:
        role === "admin" || role === "staff"
          ? "verified"
          : faker.helpers.arrayElement(["unverified", "pending", "verified"]),
      lastLogin: faker.date.recent().toISOString(),
      addresses: Array.from(
        { length: faker.number.int({ min: 1, max: 3 }) },
        () => ({
          type: faker.helpers.arrayElement(["shipping", "billing"]),
          isPrimary: faker.datatype.boolean(),
          street: faker.string.numeric(3),
          city: province.name,
          state: district.name,
          country: "Việt Nam",
          phone: `0${faker.string.numeric(9)}`,
        })
      ),
      createdAt: faker.date.past({ years: 2 }).toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    };

    users.push(user);

    // Generate a cart for the user
    carts.push({
      id: generateId(),
      userId: user.id,
      items: [],
      createdAt: faker.date.past({ years: 1 }).toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    });

    // Generate a favourites list for the user
    favourites.push({
      id: generateId(),
      userId: user.id,
      items: Array.from(
        { length: faker.number.int({ min: 1, max: 5 }) },
        () => ({
          productId: generateId(),
          addedAt: faker.date.recent().toISOString(),
        })
      ),
      createdAt: faker.date.past({ years: 1 }).toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    });
  }

  return { users, carts, favourites }; // Include favourites in the return
};

// Update generatePharmacyProducts for Vietnamese products
const generatePharmacyProducts = (count, categories, suppliers, brands) => {
  const products = [];
  const calculateDiscountedPrice = (basePrice, discount) => {
    if (!discount) return basePrice;
    return Math.max(
      basePrice - (basePrice * discount.value) / 100,
      basePrice - discount.maxDiscountAmount || 0
    );
  };

  // Array of real product images from Cloudinary
  const cloudinaryProductImages = [
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341495/00021988-anica-phytextra-60v-513_fc7gpe.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341495/00031920-top-grow-jpanwell-10-ch_vogxfu.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341495/00031920-top-grow-jpanwell-10-ch_1_a0fqlp.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341495/00031036-omexxel-ginkgo-120-2x15_hx0z2x.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341494/00029929-maxpremum-naga-plus-200_uu8e9w.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341494/00030869-sasagold-saffron-nhuy-h_btbsu0.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341489/img-9003-7e22ddc19e_1_czsgxg.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341489/dsc-09932-bc701e2141_y7evhl.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341489/dsc-09866-48ad7ea252_mf8bzn.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341489/hebe-tuyp-truoc-908f63e863_xzl4jv.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341488/dsc-00535-480fad02f8_1_mxnxvw.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341487/00503275-vien-uong-bo-sung-canxi_qjtovs.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341487/00032817-blood-care-jpanwell-60v_ule2rv.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341487/dsc-00036-f81526ba97_oojjx4.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341487/dsc-00025-00386132d2_ryqm1b.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341487/00502603-vien-uong-tang-cuong-ch_ytdohn.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341486/00503081-sap-duong-am-vaseline-r_xz0dfq.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341485/00503066-son-duong-moi-sebamed-l_iuf3kn.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341485/00032923-vien-uong-cai-thien-tim_m6kd4c.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341485/00502680-vien-uong-lam-dep-da-ch_we06np.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341485/00502416-blackmores-executive-b-4_fsoxxw.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341485/00501988-sua-cho-benh-nhan-gan-f_pyyoou.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341484/00032918-glucosamine-and-chondro_xsbh2t.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341484/00032923-vien-uong-cai-thien-tim_1_b56yqn.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341484/00032884-okinawa-fucoidan-jpanwe_ohmdom.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341483/00031920-top-grow-jpanwell-10-ch-3f81b1a4-df3b-41f3-869d-c64cb90506fa_qble7r.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341483/00500955-tra-nhan-sam-ko-ginseng_a9hd5l.png",
    "https://res.cloudinary.com/dbmtxumro/image/upload/v1746341483/00500119-vien-uong-ho-tro-giam-n_fyciyl.png",
  ];

  for (let i = 0; i < count; i++) {
    const category = faker.helpers.arrayElement(categories);
    const supplier = faker.helpers.arrayElement(suppliers);

    const vietnameseProductPrefixes = [
      "Thuốc",
      "Viên",
      "Kem",
      "Sirô",
      "Dung dịch",
      "Dầu",
      "Miếng dán",
      "Bột",
      "Cồn",
      "Nước",
      "Thực phẩm chức năng",
      "Vitamin",
    ];

    const vietnameseProductMaterials = [
      "thảo dược",
      "kháng sinh",
      "giảm đau",
      "kháng viêm",
      "tiêu hóa",
      "da liễu",
      "mắt",
      "hô hấp",
      "tim mạch",
      "dinh dưỡng",
    ];

    const prefix = faker.helpers.arrayElement(vietnameseProductPrefixes);
    const material = faker.helpers.arrayElement(vietnameseProductMaterials);
    const brand = supplier.name.split(" ").slice(0, 2).join(" ");

    if (!brands.includes(brand)) {
      brands.push(brand); // Collect unique brands
    }

    const productName = `${prefix} ${material} ${brand} ${faker.string.numeric(
      3
    )}`;

    const discountValue = faker.datatype.boolean(0.7) // 70% chance to have a discount
      ? faker.number.int({ min: 5, max: 25 })
      : null;
    const maxDiscountAmount = discountValue
      ? faker.number.int({ min: 500000, max: 2000000 })
      : null;

    const basePrice = roundToNearest10k(
      faker.number.int({ min: 20000, max: 100000000 })
    );
    const salePrice = discountValue
      ? roundToNearest10k(basePrice * (1 - discountValue / 100))
      : basePrice; // Set salePrice to basePrice if no discount

    const cost = roundToNearest10k(
      faker.number.int({ min: 20000, max: basePrice })
    );

    const targeted = faker.helpers.arrayElement([
      "Nam",
      "Nữ",
      "Trẻ em",
      "Người cao tuổi",
      "Phụ nữ mang thai",
    ]);

    const weight = faker.helpers.arrayElement([
      "Dưới 100g",
      "100g - 200g",
      "200g - 500g",
      "500g - 1kg",
      "Trên 1kg",
    ]);

    // Generate product images, using Cloudinary URL for the primary image
    const primaryImageUrl = faker.helpers.arrayElement(cloudinaryProductImages);
    const imagesCount = faker.number.int({ min: 1, max: 4 });
    
    const images = [{
      id: generateId(),
      url: primaryImageUrl,
      alt: `${productName} - Sản phẩm`,
      isPrimary: true,
      sortOrder: 0
    }];
    
    // Add additional images if needed
    if (imagesCount > 1) {
      const additionalImages = Array.from(
        { length: imagesCount - 1 },
        (_, index) => ({
          id: generateId(),
          url: `https://picsum.photos/seed/${faker.number.int(1000)}/500/500`,
          alt: `${productName} - Hình chi tiết ${index + 1}`,
          isPrimary: false,
          sortOrder: index + 1,
        })
      );
      images.push(...additionalImages);
    }

    const product = {
      id: generateId(),
      name: productName,
      category: category.id,
      categoryName: category.name,
      subCategory: material,
      sku: `DOLA-${faker.string.alphanumeric(6).toUpperCase()}`,
      requiresPrescription: faker.datatype.boolean(0.5),
      basePrice: basePrice,
      salePrice: salePrice, // Ensure salePrice is set
      cost: cost,
      priceRange: getPriceRange(basePrice),
      discount: discountValue
        ? {
            type: "percentage",
            value: discountValue,
            maxDiscountAmount: maxDiscountAmount,
          }
        : null,
      discountedPrice: calculateDiscountedPrice(basePrice, {
        type: "percentage",
        value: discountValue,
        maxDiscountAmount: maxDiscountAmount,
      }),
      supplierId: supplier.id,
      brand: brand,
      images: images,
      variants: Array.from(
        { length: faker.number.int({ min: 0, max: 2 }) },
        () => ({
          id: generateId(),
          name: `${material} - Loại ${faker.number.int(100)}`,
          sku: `DOLA-${faker.string.alphanumeric(10).toUpperCase()}`,
          price: roundToNearest10k(
            faker.number.int({ min: 20000, max: 500000 })
          ),
          stock: faker.number.int({ min: 0, max: 100 }),
        })
      ),
      stock: {
        total: faker.number.int({ min: 10, max: 1000 }),
        reserved: faker.number.int({ min: 0, max: 10 }),
        available: faker.number.int({ min: 0, max: 990 }),
        lowStockThreshold: faker.number.int({ min: 5, max: 20 }),
        lastRestocked: faker.date.recent().toISOString(),
      },
      description: `<h3>Thông tin sản phẩm ${productName}</h3>
<p><strong>Công dụng:</strong> Sản phẩm ${productName} giúp điều trị các vấn đề sức khỏe liên quan đến ${material}. Sử dụng đúng liều lượng để đạt hiệu quả tốt nhất.</p>
<p><strong>Đặc điểm nổi bật:</strong></p>
<ul>
  <li>Được sản xuất bởi ${supplier.name}</li>
  <li>Hiệu quả trong việc ${faker.helpers.arrayElement([
    "giảm đau",
    "kháng viêm",
    "tăng cường miễn dịch",
    "hỗ trợ tiêu hóa",
    "cải thiện giấc ngủ",
  ])}</li>
  <li>Phù hợp với ${faker.helpers.arrayElement([
    "người lớn",
    "trẻ em trên 12 tuổi",
    "mọi đối tượng",
    "người cao tuổi",
  ])}</li>
</ul>
<p><em>Lưu ý: Đọc kỹ hướng dẫn sử dụng trước khi dùng. Bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp.</em></p>`,
      ingredients: `Thành phần chính: ${faker.lorem.words(5)}`,
      dosage: `Liều dùng: ${faker.number.int({
        min: 1,
        max: 3,
      })} lần/ngày, ${faker.number.int({ min: 1, max: 2 })} viên/lần.`,
      warnings: `Cảnh báo: Không sử dụng khi ${faker.lorem.sentence()}`,
      origin: "Việt Nam",
      manufacturerName: supplier.name,
      status: faker.helpers.weightedArrayElement([
        { weight: 7, value: "active" },
        { weight: 1, value: "inactive" },
        { weight: 1, value: "out_of_stock" },
        { weight: 1, value: "discontinued" },
      ]),
      isFeatured: faker.datatype.boolean(0.2),
      isPopular: faker.datatype.boolean(0.3),
      averageRating: faker.number.float({ min: 3.5, max: 5, precision: 0.1 }),
      reviewCount: faker.number.int({ min: 0, max: 250 }),
      targeted: targeted,
      weight: weight,
      createdAt: faker.date.past({ years: 2 }).toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    };

    products.push(product);
  }

  return products;
};

// Generate orders and orderItems with Vietnamese content
const generateOrders = (count, users, products) => {
  const orders = [];
  const orderItems = [];

  for (let i = 0; i < count; i++) {
    const user = faker.helpers.arrayElement(
      users.filter((u) => u.role === "customer")
    );
    const orderId = generateId();
    const itemsCount = faker.number.int({ min: 1, max: 5 });

    const items = Array.from({ length: itemsCount }, () => {
      const product = faker.helpers.arrayElement(products);
      const quantity = faker.number.int({ min: 1, max: 5 });
      const price = product.salePrice || product.basePrice;

      const orderItem = {
        id: generateId(),
        orderId,
        productId: product.id,
        productName: product.name,
        quantity,
        price: price,
        total: quantity * price,
      };

      orderItems.push(orderItem);
      return orderItem;
    });

    const order = {
      id: orderId,
      userId: user.id,
      items: items.map((item) => item.id),
      total: items.reduce((sum, item) => sum + item.total, 0),
      status: faker.helpers.arrayElement(["pending", "completed", "cancelled"]),
      createdAt: faker.date.past({ years: 1 }).toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    };

    orders.push(order);
  }

  return { orders, orderItems };
};

// Main function to generate all data
const generateData = async () => {
  const dbFilePath = "db.json";

  // Clear the db.json file before generating new data
  await fs.writeFile(dbFilePath, JSON.stringify({}, null, 2));

  const categories = generatePharmacyCategories(10);
  const suppliers = generatePharmacySuppliers(10);
  const { users, carts, favourites } = await generatePharmacyUsers(30); // Destructure favourites
  const brands = []; // Initialize brands array
  const products = generatePharmacyProducts(40, categories, suppliers, brands);
  const { orders, orderItems } = generateOrders(20, users, products);

  // Calculate total products for each category
  categories.forEach((category) => {
    category.totalProducts = products.filter(
      (product) => product.category === category.id
    ).length;
  });

  const data = {
    categories,
    suppliers,
    products,
    users,
    carts, // Include carts in the output
    favourites, // Include favourites in the output
    orders,
    orderItems,
    brands, // Include brands in the output
    prescriptions: [],
    reviews: [],
    wishlist: [],
  };

  // Write to db.json
  await fs.writeFile(dbFilePath, JSON.stringify(data, null, 2));
  console.log(
    "Pharmacy e-commerce data generation complete! Written to db.json"
  );
};

generateData().catch(console.error);
