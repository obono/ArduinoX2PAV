#include "unicorn_hat_hd.h"

#define _SOF 0x72

const SPISettings UnicornHatHD::mySPISettings(9000000, MSBFIRST, SPI_MODE0);

void UnicornHatHD::init(void)
{
    SPI.begin();
}

void UnicornHatHD::transferFrameBuffer(uint16_t *frameBuffer, uint8_t brightness)
{
    SPI.beginTransaction(UnicornHatHD::mySPISettings);
    digitalWrite(SS, LOW);
    SPI.transfer(_SOF);
    for (uint16_t *p = frameBuffer; p < frameBuffer + LED_WIDTH * LED_HEIGHT; p++) {
        SPI.transfer((*p >> 8 & 0xF8 | *p >> 13 & 0x07) * brightness / BRIGHTNESS_MAX); // Red
        SPI.transfer((*p >> 3 & 0xFC | *p >> 10 & 0x03) * brightness / BRIGHTNESS_MAX); // Green
        SPI.transfer((*p << 3 & 0xF8 | *p >> 2  & 0x07) * brightness / BRIGHTNESS_MAX); // Blue
    }
    digitalWrite(SS, HIGH);
    SPI.endTransaction();
}

void UnicornHatHD::screenOff(void)
{
    SPI.beginTransaction(mySPISettings);
    digitalWrite(SS, LOW);
    SPI.transfer(_SOF);
    for (int i = 0; i < LED_WIDTH * LED_HEIGHT * 3; i++) {
        SPI.transfer(0);
    }
    digitalWrite(SS, HIGH);
    SPI.endTransaction();
}

void UnicornHatHD::finish(void)
{
    SPI.end();
}
