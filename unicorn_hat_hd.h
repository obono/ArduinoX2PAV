#pragma once

#include <SPI.h>

#define LED_WIDTH       16
#define LED_HEIGHT      16
#define BRIGHTNESS_MAX  100

class UnicornHatHD
{
private:
    static const SPISettings mySPISettings;

public:
    static void init(void);
    static void transferFrameBuffer(uint16_t *framebuffer, uint8_t brightness);
    static void screenOff(void);
    static void finish(void);
};
