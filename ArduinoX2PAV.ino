#include <arduino.h>
#include <avr/sleep.h>

#include "buffer_controller.h"
#include "unicorn_hat_hd.h"
#include "data/sample1.h"
#include "data/sample2.h"
#include "data/sample3.h"

#define BUTTON_PIN  2

#define WAIT_TIME_MAX   100         // 100 milli seconds
#define ACTIVE_TIME     (1000 * 30) // 30 seconds

#define SEQUENCE_DATA(x)    { x##BitmapData, x##BitmapTable, x##Palette, x##Scenario }

#define isTimePassed(time)  (!(millis() - (time) & bit(31)))

static void setTargetTime(void);
static void wakeUpNow(void);
static void sleep(void);

PROGMEM static const SEQUENCE_T sequences[] = {
    SEQUENCE_DATA(sample1),
    SEQUENCE_DATA(sample2),
    SEQUENCE_DATA(sample3),
    NULL
};

static BufferController controller(sequences);
static unsigned long    sceneTargetTime;
static unsigned long    activeTargetTime;
static bool             lastButtonState;

/*----------------------------------------------------------------------------*/

void setup()
{
    UnicornHatHD::init();
    pinMode(BUTTON_PIN, INPUT_PULLUP);

    setTargetTime();
    lastButtonState = digitalRead(BUTTON_PIN);
}

void loop()
{
    int buttonState = digitalRead(BUTTON_PIN);
    if (!buttonState && buttonState != lastButtonState) {
        controller.nextSequence();
        setTargetTime();
    }
    lastButtonState = buttonState;

    if (isTimePassed(sceneTargetTime)) {
        sceneTargetTime += controller.forwardSequence();
        UnicornHatHD::transferFrameBuffer(controller.getBuffer(), controller.getBrightness());
    }

    if (!isTimePassed(sceneTargetTime)) {
        unsigned long wait = sceneTargetTime - millis();
        delay(min(wait, WAIT_TIME_MAX));
    }

    if (controller.isLooped() && buttonState && isTimePassed(activeTargetTime)) {
        sleep();
    }
}

static void setTargetTime(void)
{
    sceneTargetTime = millis();
    activeTargetTime = millis() + ACTIVE_TIME;
}

static void wakeUpNow(void)
{
    sleep_disable();
    detachInterrupt(0);
}

static void sleep(void)
{
    UnicornHatHD::screenOff();
    UnicornHatHD::finish();
    sleep_enable();
    attachInterrupt(0, wakeUpNow, LOW);
    set_sleep_mode(SLEEP_MODE_PWR_DOWN);
    cli();
    sleep_bod_disable();
    sei();
    sleep_cpu();
    /* wake up here */
    sleep_disable();
    UnicornHatHD::init();
    setTargetTime();
    lastButtonState = false;
}
