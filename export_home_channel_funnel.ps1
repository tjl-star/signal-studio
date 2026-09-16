$ErrorActionPreference = 'Stop'
$base = 'http://101.132.68.174:8123/skill'

function C([int[]]$codes) {
    -join ($codes | ForEach-Object { [char]$_ })
}

$folderName = C @(0x9996,0x9875,0x6D41,0x91CF,0x4E0E,0x8F6C,0x5316,0x6F0F,0x6597)
$outDir = Join-Path $env:USERPROFILE (Join-Path 'Desktop' $folderName)
$startDate = '2026-07-04'
$endDate = '2026-08-04'
$channels = @(
    (C @(0x7CBE,0x9009)),
    ((C @(0x65B0,0x4EBA)) + '(' + (C @(0x7CBE,0x9009)) + ')'),
    (C @(0x7F8E,0x5267)),
    (C @(0x65E5,0x5267)),
    (C @(0x97E9,0x5267)),
    (C @(0x6CF0,0x5267)),
    (C @(0x56FD,0x4EA7,0x5267)),
    (C @(0x82F1,0x5267)),
    (C @(0x7535,0x5F71))
)
$newDevice = C @(0x65B0,0x8BBE,0x5907)
$oldDevice = C @(0x8001,0x8BBE,0x5907)
$androidLabel = C @(0x5B89,0x5353)
$mSiteLabel = 'M' + (C @(0x7AD9))

New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Invoke-DataProvider([string]$endpoint, [hashtable]$params) {
    $query = ($params.GetEnumerator() | ForEach-Object {
        '{0}={1}' -f [Uri]::EscapeDataString([string]$_.Key), [Uri]::EscapeDataString([string]$_.Value)
    }) -join '&'
    Invoke-RestMethod -Uri "$base/$endpoint`?$query" -TimeoutSec 60
}

$clientInfo = Invoke-DataProvider 'getAllClientTypeInfo' @{}
$clientTypes = @($clientInfo | ForEach-Object { [string]$_.client_type })
$groups = [ordered]@{
    $androidLabel = @($clientTypes | Where-Object { $_ -like 'android*' } | Sort-Object)
    'iOS' = @($clientTypes | Where-Object { $_ -like 'ios_*' -or $_ -like 'ipad_*' } | Sort-Object)
    $mSiteLabel = @($clientTypes | Where-Object { $_ -in @('web_applet', 'web_pc') } | Sort-Object)
}

$rawRows = [System.Collections.Generic.List[object]]::new()
$queryCount = 0
foreach ($platform in $groups.Keys) {
    $clientFilter = $groups[$platform] -join '#'
    foreach ($channel in $channels) {
        foreach ($device in @('new', 'old')) {
            $queryCount++
            $response = Invoke-DataProvider 'dramaConversion' @{
                startDate = $startDate
                endDate = $endDate
                source_channel = $channel
                clienttype = $clientFilter
                device_type = $device
            }
            foreach ($row in @($response)) {
                $rawRows.Add([pscustomobject]@{
                    date = $row.date
                    channel = $channel
                    client = $platform
                    device = if ($device -eq 'new') { $newDevice } else { $oldDevice }
                    homepage_tab_exposure_pv = $null
                    content_exposure_pv = $null
                    content_click_pv = $null
                    content_click_pv_rate = $null
                    homepage_channel_click_uv = $row.tab_click_uv
                    content_click_uv = $row.content_click_uv
                    content_click_uv_rate = $row.content_click_uv_rate
                    total_play_start_uv_including_ads = $row.detail_play_start_uv
                    total_play_start_uv_excluding_ads = $row.detail_after_ad_play_start_uv
                    detail_play_uv = $row.detail_play_uv
                    play_conversion_uv_rate = $row.detail_play_uv_rate
                    play_over_5m_uv = $row.detail_play_5_mins_uv
                    play_over_5m_uv_rate = $row.detail_play_5_mins_uv_rate
                    play_over_10m_uv = $row.detail_play_10_mins_uv
                    play_over_10m_uv_rate = $row.detail_play_10_mins_uv_rate
                    avg_play_duration = $row.avg_video_time
                    effective_play_uv = $row.video_uv
                    effective_play_uv_rate = $row.video_uv_rate
                    source = 'dramaConversion.tab_click_uv'
                })
            }
        }
    }
}

$rawRows = @($rawRows | Sort-Object date, channel, client, device)
$rowMap = @{}
foreach ($row in $rawRows) {
    $rowMap["$($row.date)|$($row.channel)|$($row.client)|$($row.device)"] = $row
}

$denseRows = [System.Collections.Generic.List[object]]::new()
$day = [datetime]::ParseExact($startDate, 'yyyy-MM-dd', $null)
$lastDay = [datetime]::ParseExact($endDate, 'yyyy-MM-dd', $null)
while ($day -le $lastDay) {
    foreach ($channel in $channels) {
        foreach ($platform in $groups.Keys) {
            foreach ($device in @($newDevice, $oldDevice)) {
                $key = "$($day.ToString('yyyy-MM-dd'))|$channel|$platform|$device"
                if ($rowMap.ContainsKey($key)) {
                    $denseRows.Add($rowMap[$key])
                } else {
                    $denseRows.Add([pscustomobject]@{
                        date = $day.ToString('yyyy-MM-dd')
                        channel = $channel
                        client = $platform
                        device = $device
                        homepage_tab_exposure_pv = $null
                        content_exposure_pv = $null
                        content_click_pv = $null
                        content_click_pv_rate = $null
                        homepage_channel_click_uv = $null
                        content_click_uv = $null
                        content_click_uv_rate = $null
                        total_play_start_uv_including_ads = $null
                        total_play_start_uv_excluding_ads = $null
                        detail_play_uv = $null
                        play_conversion_uv_rate = $null
                        play_over_5m_uv = $null
                        play_over_5m_uv_rate = $null
                        play_over_10m_uv = $null
                        play_over_10m_uv_rate = $null
                        avg_play_duration = $null
                        effective_play_uv = $null
                        effective_play_uv_rate = $null
                        source = 'dramaConversion.tab_click_uv'
                    })
                }
            }
        }
    }
    $day = $day.AddDays(1)
}

$manifest = [ordered]@{
    source = 'data-provider /skill/dramaConversion'
    endpoint_field = 'tab_click_uv'
    endpoint_field_meaning = 'homepage channel click UV'
    date_range = @($startDate, $endDate)
    channels = $channels
    client_groups = [ordered]@{
        $androidLabel = ($groups[$androidLabel] -join '#')
        iOS = ($groups['iOS'] -join '#')
        $mSiteLabel = ($groups[$mSiteLabel] -join '#')
    }
    device_types = [ordered]@{ new = $newDevice; old = $oldDevice }
    query_count = $queryCount
    returned_row_count = $rawRows.Count
    dense_row_count = $denseRows.Count
    requested_fields = @(
        'homepage_tab_exposure_pv', 'content_exposure_pv', 'content_click_pv', 'content_click_pv_rate',
        'content_click_uv', 'content_click_uv_rate', 'total_play_start_uv_including_ads',
        'total_play_start_uv_excluding_ads', 'play_conversion_uv_rate', 'play_over_5m_uv',
        'play_over_5m_uv_rate', 'play_over_10m_uv', 'play_over_10m_uv_rate', 'avg_play_duration',
        'effective_play_uv', 'effective_play_uv_rate'
    )
    unavailable_fields = @('homepage_tab_exposure_pv', 'content_exposure_pv', 'content_click_pv', 'content_click_pv_rate')
    note = 'Blank values mean that the API returned no record for the combination; unavailable PV/exposure fields are intentionally blank and are not replaced with UV values or zero.'
}

@{ manifest = $manifest; rows = $rawRows } |
    ConvertTo-Json -Depth 10 |
    Set-Content -Encoding UTF8 (Join-Path $outDir 'home_channel_traffic_detail.json')
$denseRows | Export-Csv -NoTypeInformation -Encoding UTF8 (Join-Path $outDir 'home_channel_traffic_matrix.csv')
$manifest | ConvertTo-Json -Depth 10 | Set-Content -Encoding UTF8 (Join-Path $outDir 'query_notes.txt')

@{ manifest = $manifest; rows = $rawRows } |
    ConvertTo-Json -Depth 10 |
    Set-Content -Encoding UTF8 (Join-Path $outDir 'home_funnel_requested_fields.json')
$denseRows | Export-Csv -NoTypeInformation -Encoding UTF8 (Join-Path $outDir 'home_funnel_requested_fields.csv')
$manifest | ConvertTo-Json -Depth 10 | Set-Content -Encoding UTF8 (Join-Path $outDir 'home_funnel_requested_fields_notes.txt')

$pvRows = @($denseRows | ForEach-Object {
    [pscustomobject]@{
        date = $_.date
        channel = $_.channel
        client = $_.client
        device = $_.device
        homepage_tab_exposure_pv = $null
        content_exposure_pv = $null
        content_click_pv = $null
        content_click_pv_rate = $null
        total_play_pv_including_ads = $null
        total_play_pv_excluding_ads = $null
        play_pv_conversion_rate = $null
        play_over_5m_pv = $null
        play_over_5m_pv_rate = $null
        play_over_10m_pv = $null
        play_over_10m_pv_rate = $null
        effective_play_pv = $null
        effective_play_pv_rate = $null
        source = 'data-provider /skill/dramaConversion (PV fields unavailable)'
    }
})
$pvManifest = [ordered]@{
    source = 'data-provider /skill/dramaConversion'
    date_range = @($startDate, $endDate)
    row_count = $pvRows.Count
    fields = @(
        'homepage_tab_exposure_pv', 'content_exposure_pv', 'content_click_pv', 'content_click_pv_rate',
        'total_play_pv_including_ads', 'total_play_pv_excluding_ads', 'play_pv_conversion_rate',
        'play_over_5m_pv', 'play_over_5m_pv_rate', 'play_over_10m_pv', 'play_over_10m_pv_rate',
        'effective_play_pv', 'effective_play_pv_rate'
    )
    note = 'The configured data-provider dramaConversion endpoint returns UV metrics only. It does not expose the requested PV fields for 猜你喜欢 → PV → 首页数据; values are intentionally blank and no UV values are substituted.'
}
@{ manifest = $pvManifest; rows = $pvRows } |
    ConvertTo-Json -Depth 10 |
    Set-Content -Encoding UTF8 (Join-Path $outDir 'guess_you_like_pv_home_data.json')
$pvRows | Export-Csv -NoTypeInformation -Encoding UTF8 (Join-Path $outDir 'guess_you_like_pv_home_data.csv')
$pvManifest | ConvertTo-Json -Depth 10 | Set-Content -Encoding UTF8 (Join-Path $outDir 'guess_you_like_pv_home_data_notes.txt')

$manifest | ConvertTo-Json -Depth 10
