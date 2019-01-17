nimbus_screen.editVideoInit = function () {
    let $nsc_video_player = $('#nsc_video_player');
    let $nsc_video_time_line_box = $('#nsc_video_time_line_box');
    let $nsc_video_time_line = $('#nsc_video_time_line');
    let $nsc_video_time_line_segments = $('#nsc_video_time_line_segments');
    let $nsc_video_timeline_choose = $('#nsc_video_timeline_choose');
    let $nsc_video_time = $('#nsc_video_time');
    let $nsc_video_pause = $('#nsc_video_pause');
    let $nsc_video_play = $('#nsc_video_play');
    let $nsc_video_zoom_range = $('#nsc_video_zoom_range');
    let $nsc_video_button_trim = $('#nsc_video_button_trim');
    let $nsc_video_zoom_time = $('#nsc_video_zoom_time');
    let $nsc_video_crop = $('#nsc_video_crop');
    let $nsc_done_video = $('#nsc_done_video');

    let player = $nsc_video_player[0];
    let zoom_range = 15;
    let duration = 0;
    let select_crop = false;
    let start_crop = 0;
    let finish_crop = 0;
    let start_crop_lost = 0;
    let finish_crop_lost = 0;
    let position_crop = {x: 0, y: 0, w: 0, h: 0};
    let jcrop = null;

    $nsc_video_zoom_range.val(zoom_range);
    $nsc_video_zoom_time.text(zoom_range + ' / 100');

    function crop() {
        console.log('crop', position_crop)
    }

    function createCropButton() {
        $('#nsc_video_crop_button').remove();

        let $ns_crop_buttons = $('<div/>', {
            'id': 'nsc_video_crop_button',
            'class': 'ns-crop-buttons bottom'
        });

        $('<button/>', {
            html: '<i></i><span>' + chrome.i18n.getMessage("cropBtnSave") + '</span>',
            'class': 'ns-btn save'
        }).on('click', function () {
            $('#nsc_video_crop_pole').remove();
            $nsc_video_crop.removeClass('active');
            jcrop && jcrop.destroy();
            crop()
        }).appendTo($ns_crop_buttons);

        $('<button/>', {
            html: '<i></i><span>' + chrome.i18n.getMessage("cropBtnCancel") + '</span>',
            'class': 'ns-btn cancel'
        }).on('click', function () {
            $('#nsc_video_crop_pole').remove();
            $nsc_video_crop.removeClass('active');
            jcrop && jcrop.destroy();
        }).appendTo($ns_crop_buttons);

        let drag = $('.jcrop-dragbar').first();
        drag.before($ns_crop_buttons);
    }

    let getTimeLineSegment = function (left, text) {
        if (text) {
            return $('<div>').addClass('nsc-ve-time-segment-big nsc-ve-time-segment-start').css('left', left).append(
                $('<span>').addClass('nsc-ve-time-segment-text').text(text)
            )
        } else {
            return $('<div>').addClass('nsc-ve-time-segment').css('left', left)
        }
    };

    let getTimeString = function (duration, is_second) {
        is_second = is_second === undefined ? true : is_second;

        let house = Math.floor(duration / 3600);
        let minute = Math.floor(duration / 60) - house * 60;
        let second = duration - house * 3600 - minute * 60;

        return (house < 10 ? '0' + house : house) + ':' + (minute < 10 ? '0' + minute : minute) + (is_second ? ':' + (second < 10 ? '0' + second : second) : '');
    };

    $nsc_video_player.attr('src', nimbus_screen.info.file.patch);

    player.onloadedmetadata = function (e) {
        duration = Math.floor(player.duration);
        nimbus_screen.dom.$nsc_pre_load.hide();
        nimbus_screen.dom.$nsc_video_page.show();
        $nsc_video_pause.hide();

        $nsc_video_time.text(getTimeString(player.currentTime));
        $nsc_video_time_line.width(zoom_range * duration / 60);

        for (let left = 0, current = 0; current <= duration; current += 60, left += zoom_range) {
            $nsc_video_time_line_segments.append(getTimeLineSegment(left, (current / 60 % 5 === 0 ? getTimeString(current, false) : false)))
        }
    };

    player.ontimeupdate = function (e) {
        let currentTime = Math.floor(player.currentTime);
        $('#nsc_video_time_line_cursor').css('left', currentTime / 60 * zoom_range);
        $nsc_video_time.text(getTimeString(currentTime));
    };
    player.onplay = function () {
        $nsc_video_play.hide();
        $nsc_video_pause.show();
    };
    player.onpause = function () {
        $nsc_video_play.show();
        $nsc_video_pause.hide();
    };

    $nsc_video_play.on('click', function () {
        player.play()
    });

    $nsc_video_pause.on('click', function () {
        player.pause()
    });

    $nsc_video_button_trim.on('click', function () {
        let start = Math.floor(start_crop_lost / zoom_range * 60);
        let duration = Math.floor(finish_crop_lost / zoom_range * 60 - start);

        console.log('trim', start, 'duration', duration);
        nacl_module.convert({format: 'webm', trim: {start: start, duration: duration}}, function () {

        });
    });

    $nsc_video_zoom_range.on('input', function () {
        let new_zoom_range = +$(this).val();
        if ($nsc_video_timeline_choose.is(':visible')) {
            start_crop_lost = start_crop_lost / zoom_range * new_zoom_range;
            finish_crop_lost = finish_crop_lost / zoom_range * new_zoom_range;

            if (start_crop_lost > finish_crop_lost) {
                $nsc_video_timeline_choose.css({
                    left: (finish_crop_lost - 5) + 'px',
                    width: (start_crop_lost - finish_crop_lost + 10) + 'px'
                }).show();
            } else {
                $nsc_video_timeline_choose.css({
                    left: (start_crop_lost - 5) + 'px',
                    width: (finish_crop_lost - start_crop_lost + 10) + 'px'
                }).show();
            }
        }

        zoom_range = new_zoom_range;
        $nsc_video_zoom_time.text(new_zoom_range + ' / 100');
        $nsc_video_time_line_segments.empty();
        player.onloadedmetadata();
    });

    $nsc_video_time_line.on('mousemove', function (e, select) {
        let offset = $nsc_video_time_line.offset();
        finish_crop = e.pageX - offset.left;

        if (start_crop === finish_crop - 1 || start_crop === finish_crop + 1) select_crop = true;
        if (select) select_crop = select;

        if (select_crop) {
            if (start_crop > finish_crop) {
                $nsc_video_timeline_choose.css({
                    left: (finish_crop - 5) + 'px',
                    width: (start_crop - finish_crop + 10) + 'px'
                }).show();
            } else {
                $nsc_video_timeline_choose.css({
                    left: (start_crop - 5) + 'px',
                    width: (finish_crop - start_crop + 10) + 'px'
                }).show();
            }
        }
    });

    $nsc_video_time_line
        .on('mousedown', function (e) {
            let offset = $nsc_video_time_line.offset();
            start_crop = finish_crop = e.pageX - offset.left;

            if ($(e.target).hasClass('nsc-ve-timeline-choose-handler') || $(e.target).closest('.nsc-ve-timeline-choose-handler').length) {
                let offset2 = $nsc_video_timeline_choose.offset();
                let event = $.Event('mousemove');
                event.pageX = e.pageX;
                if ($(e.target).hasClass('nsc-ve-timeline-choose-handler-left') || $(e.target).closest('.nsc-ve-timeline-choose-handler-left').length) {
                    let width = $nsc_video_timeline_choose.width();
                    start_crop = offset2.left - offset.left + width - 5;
                } else {
                    start_crop = offset2.left - offset.left + 5;
                }
                $nsc_video_time_line.trigger(event, [true])
            }
        })
        .on('mouseup', function (e) {
            if (!select_crop) {
                let offset = $nsc_video_time_line.offset();
                let offsetX = e.pageX - offset.left;
                let currentTime = offsetX / zoom_range * 60;
                if (currentTime > duration) currentTime = duration;
                player.currentTime = currentTime;
                if (!$(e.target).hasClass('nsc-ve-timeline-choose')) {
                    $nsc_video_timeline_choose.hide();
                }
            }

            select_crop = false;
            start_crop_lost = start_crop;
            finish_crop_lost = finish_crop;
            start_crop = 0;
            finish_crop = 0;
        });

    $nsc_video_crop.on('click', function () {
        $nsc_video_crop.addClass('active');
        const w = $nsc_video_player.width();
        const h = $nsc_video_player.height();

        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext("2d");
        canvas.width = player.videoWidth;
        canvas.height = player.videoHeight;
        ctx.drawImage(player, 0, 0);

        let $bg = $('<div/>', {id: 'nsc_video_crop_pole'});
        $bg.css('width', w + 'px');
        $bg.css('height', h + 'px');
        $bg.css('background', '#414141');
        $bg.css('position', 'absolute');
        $bg.css('z-index', 1);

        let $pole = $('<div/>');
        $pole.css('position', 'absolute');
        $pole.css('left', '50%');
        $pole.css('top', '50%');
        $pole.css('margin-right', '-50%');
        $pole.css('transform', 'translate(-50%, -50%)');


        let $image = $('<img/>', {id: 'nsc_crop_image', src: canvas.toDataURL()});

        $pole.append($image);
        $bg.append($pole);

        jcrop = $.Jcrop($image, {
            boxWidth: w,
            boxHeight: h,
            onSelect: createCropButton,
            onChange: function (c) {
                position_crop = {x: c.x, y: c.y, w: c.w, h: c.h}
            }
        });

        $pole.bind({
            'mousemove': function (e) {
                if (e.which === 3) {
                    $('#nsc_video_crop_pole').remove();
                    $nsc_video_crop.removeClass('active');
                    jcrop && jcrop.destroy();
                    return false;
                }
            },
            'contextmenu': function (e) {
                $('#nsc_video_crop_pole').remove();
                $nsc_video_crop.removeClass('active');
                jcrop && jcrop.destroy();
                return false;
            }
        });

        $nsc_video_player.before($bg)
    });

    $nsc_done_video.on('click', function () {

    });
};
