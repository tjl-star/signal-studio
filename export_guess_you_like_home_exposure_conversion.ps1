$ErrorActionPreference = 'Stop'
$base = 'http://101.132.68.174:8123/skill'

function C([int[]]$codes) { -join ($codes | ForEach-Object { [char]$_ }) }

$folderName = C @(0x9996,0x9875,0x6D41,0x91CF,0x4E0E,0x8F6C,0x5316,0x6F0F,0x6597)
$outDir = Join-Path $env:USERPROFILE (Join-Path 'Desktop' $folderName)
$startDate = '2026-07-05'
$endDate = '2026-08-04'
$sourceChannel = C @(0x7CBE,0x9009)
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

$rows = [System.Collections.Generic.List[object]]::new()
foreach ($platform in $groups.Keys) {
    $response = Invoke-DataProvider 'dramaConversion' @{
        startDate = $startDate
        endDate = $endDate
        source_channel = $sourceChannel
        clienttype = ($groups[$platform] -join '#')
    }
    foreach ($item in @($response)) {
        $rows.Add([pscustomobject]@{
            date = $item.date
            client = $platform
            source_channel = $sourceChannel
            home_tab_exposure_uv = $null
            home_tab_exposure_pv = $null
            first_frame_play_overall_conversion_rate = $item.first_frame_play_uv_rate
            play_over_5m_overall_conversion_rate = $item.play_5_mins_uv_rate
            content_exposure_uv = $null
            content_exposure_pv = $null
            content_click_uv = $item.content_click_uv
            content_click_pv = $null
            content_click_uv_rate = $item.content_click_uv_rate
            content_click_pv_rate = $null
            source = 'dramaConversion'
        })
    }
}

$rows = @($rows | Sort-Object date, client)
$manifest = [ordered]@{
    source = 'data-provider /skill/dramaConversion'
    source_channel = $sourceChannel
    date_range = @($startDate, $endDate)
    clients = [ordered]@{
        $androidLabel = ($groups[$androidLabel] -join '#')
        iOS = ($groups['iOS'] -join '#')
        $mSiteLabel = ($groups[$mSiteLabel] -join '#')
    }
    query_count = 3
    returned_row_count = $rows.Count
    available_fields = @('date', 'client', 'first_frame_play_overall_conversion_rate', 'play_over_5m_overall_conversion_rate', 'content_click_uv', 'content_click_uv_rate')
    unavailable_fields = @('home_tab_exposure_uv', 'home_tab_exposure_pv', 'content_exposure_uv', 'content_exposure_pv', 'content_click_pv', 'content_click_pv_rate')
    note = 'The verified homepage conversion API returns content-click UV and UV conversion rates only. It does not return tab exposure, content exposure, or PV fields; blank values are intentional and no detail-page data is substituted.'
}

@{ manifest = $manifest; rows = $rows } |
    ConvertTo-Json -Depth 10 |
    Set-Content -Encoding UTF8 (Join-Path $outDir 'guess_you_like_home_exposure_conversion.json')
$rows | Export-Csv -NoTypeInformation -Encoding UTF8 (Join-Path $outDir 'guess_you_like_home_exposure_conversion.csv')
$manifest | ConvertTo-Json -Depth 10 | Set-Content -Encoding UTF8 (Join-Path $outDir 'guess_you_like_home_exposure_conversion_notes.txt')

$manifest | ConvertTo-Json -Depth 10
