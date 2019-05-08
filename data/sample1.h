#pragma once

#if DATA_FORMAT_VERSION != 1
#warning Invalid format version
#endif

PROGMEM const uint8_t sample1BitmapData[] = {
    0x00, 0x77, 0x0f, 0x0f, 0x0f, 0x0f, 0x0f, 0x0f, 0x0f, 0x0f, 0x01, 0x77, 0x00, 0x55, 0x00, 0x55,
    0x00, 0x55, 0x00, 0x55, 0xaa, 0xff, 0xaa, 0xff, 0xaa, 0xff, 0xaa, 0xff, 0x02, 0x77, 0x05, 0x47,
    0x77, 0x05, 0x47, 0x77, 0x05, 0x47, 0x77, 0x05, 0x47, 0x77, 0x05, 0x47, 0x77, 0x05, 0x47, 0x77,
    0x05, 0x47, 0x77, 0x05, 0x47, 0x77, 0x03, 0x77, 0x00, 0x11, 0x22, 0x33, 0x00, 0x11, 0x22, 0x33,
    0x44, 0x55, 0x66, 0x77, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xaa, 0xbb, 0x88, 0x99, 0xaa, 0xbb,
    0xcc, 0xdd, 0xee, 0xff, 0xcc, 0xdd, 0xee, 0xff, 0x04, 0x77, 0x00, 0x02, 0x11, 0x08, 0x63, 0x21,
    0x0a, 0x53, 0x18, 0xe7, 0x42, 0x12, 0x95, 0x29, 0x6b, 0x63, 0x1a, 0xd7, 0x39, 0xef, 0x84, 0x23,
    0x19, 0x4a, 0x73, 0xa5, 0x2b, 0x5b, 0x5a, 0xf7, 0xc6, 0x33, 0x9d, 0x6b, 0x7b, 0xe7, 0x3b, 0xdf,
    0x7b, 0xff, 0x05, 0x77, 0x00, 0x10, 0x83, 0x82, 0x18, 0xa3, 0x10, 0x51, 0x87, 0x92, 0x59, 0xa7,
    0x20, 0x92, 0x8b, 0xa2, 0x9a, 0xab, 0x30, 0xd3, 0x8f, 0xb2, 0xdb, 0xaf, 0xc3, 0x1c, 0xb3, 0x41,
    0x14, 0x93, 0xd3, 0x5d, 0xb7, 0x51, 0x55, 0x97, 0xe3, 0x9e, 0xbb, 0x61, 0x96, 0x9b, 0xf3, 0xdf,
    0xbf, 0x71, 0xd7, 0x9f,
};

PROGMEM const uint16_t sample1BitmapTable[] = {
    0x0000, 0x000a, 0x001c, 0x0036, 0x0058, 0x0082,
};

PROGMEM const uint16_t sample1Palette[] = {
    0x0000, 0xffff, 0x0000, 0xf800, 0x07e0, 0x001f, 0xffe0, 0xf81f, 0x07ff, 0xffff, 0x0000, 0x0015,
    0x500a, 0x054a, 0xaaaa, 0x52aa, 0xad55, 0xffff, 0xf80a, 0xfd40, 0xffe0, 0x07ea, 0x055f, 0x52b5,
    0xfab5, 0xfd55, 0x0000, 0x5000, 0xa800, 0xf800, 0x02a0, 0x52a0, 0xaaa0, 0xfaa0, 0x0540, 0x5540,
    0xad40, 0xfd40, 0x07e0, 0x57e0, 0xafe0, 0xffe0, 0x001f, 0x501f, 0xa81f, 0xf81f, 0x02bf, 0x52bf,
    0xaabf, 0xfabf, 0x055f, 0x555f, 0xad5f, 0xfd5f, 0x07ff, 0x57ff, 0xafff, 0xffff, 0x000a, 0x500a,
    0xa80a, 0xf80a, 0x02aa, 0x52aa, 0xaaaa, 0xfaaa, 0x054a, 0x554a, 0xad4a, 0xfd4a, 0x07ea, 0x57ea,
    0xafea, 0xffea, 0x0015, 0x5015, 0xa815, 0xf815, 0x02b5, 0x52b5, 0xaab5, 0xfab5, 0x0555, 0x5555,
    0xad55, 0xfd55, 0x07f5, 0x57f5, 0xaff5, 0xfff5,
};

PROGMEM const uint16_t sample1Scenario[] = {
    0xfff0, 0x7bef, 0x6084, 0x0000, 0x09c4, 0x6084, 0x0402, 0x09c4, 0x6084, 0x0802, 0x09c4, 0x6084,
    0x0c0a, 0x09c4, 0x6084, 0x101a, 0x09c4, 0x6084, 0x141a, 0x09c4, 0xffff,
};
