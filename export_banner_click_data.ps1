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
    (C @(0x56FD,0x4EA7,0x5267)),
    (C @(0x7535,0x5F71)),
    (C @(0x7F8E,0x5267)),
    (C @(0x82F1,0x5267)),
    (C @(0x97E9,0x5267)),
    (C @(0x65E5,0x5267)),
    (C @(0x6CF0,0x5267)),
    (C @(0x7CBE,0x9009))
)
$androidLabel = C @(0x5B89,0x5353)
$mSiteLabel = 'M' + (C @(0x7AD9))
$platforms = [ordered]@{
    $androidLabel = 'and'
    'iOS' = 'ios'
    $mSiteLabel = 'web'
}

New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Invoke-DataProvider([string]$endpoint, [hashtable]$params) {
    $query = ($params.GetEnumerator() | ForEach-Object {
        '{0}={1}' -f [Uri]::EscapeDataString([string]$_.Key), [Uri]::EscapeDataString([string]$_.Value)
    }) -join '&'
    Invoke-RestMethod -Uri "$base/$endpoint`?$query" -TimeoutSec 60
}

$rows = [System.Collections.Generic.List[object]]::new()
$queryCount = 0
foreach ($platform in $platforms.Keys) {
    foreach ($channel in $channels) {
        $queryCount++
        $positionId = $channel + '-banner'
        $response = Invoke-DataProvider 'bannerClickData' @{
            startDate = $startDate
            endDate = $endDate
            clienttype = $platforms[$platform]
            position_id = $positionId
        }
        foreach ($item in @($response)) {
            $rows.Add([pscustomobject]@{
                date = $item.date
                channel = $channel
                client = $platform
                clienttype_raw = $item.clienttype
                position_id = $item.position_id
                banner_position = $item.banner_position
                title = $item.title
                exposure_uv = $item.uv_expose_count
                click_uv = $item.uv_click_count
                exposure_pv = $item.vv_expose_count
                click_pv = $item.vv_click_count
                ctr_uv = $item.ctr_uv
                ctr_pv = $item.ctr_pv
                jump_play_count = $null
                source = 'bannerClickData'
            })
        }
    }
}

$rows = @($rows | Sort-Object date, channel, client, banner_position, title)
$manifest = [ordered]@{
    source = 'data-provider /skill/bannerClickData'
    date_range = @($startDate, $endDate)
    channels = $channels
    clients = [ordered]@{
        $androidLabel = 'and'
        iOS = 'ios'
        $mSiteLabel = 'web'
    }
    query_count = $queryCount
    returned_row_count = $rows.Count
    returned_fields = @('date', 'clienttype', 'position_id', 'banner_position', 'title', 'uv_expose_count', 'uv_click_count', 'vv_expose_count', 'vv_click_count', 'ctr_uv', 'ctr_pv')
    field_mapping = [ordered]@{
        exposure_uv = 'uv_expose_count'
        click_uv = 'uv_click_count'
        exposure_pv = 'vv_expose_count'
        click_pv = 'vv_click_count'
        ctr_uv = 'ctr_uv'
        ctr_pv = 'ctr_pv'
    }
    jump_play_count = 'The API did not return an independent jump-play-count field; the export column is blank and click count is not used as a substitute.'
}

@{ manifest = $manifest; rows = $rows } |
    ConvertTo-Json -Depth 10 |
    Set-Content -Encoding UTF8 (Join-Path $outDir 'banner_click_detail.json')
$rows | Export-Csv -NoTypeInformation -Encoding UTF8 (Join-Path $outDir 'banner_click_data.csv')
$manifest | ConvertTo-Json -Depth 10 | Set-Content -Encoding UTF8 (Join-Path $outDir 'banner_click_query_notes.txt')

$manifest | ConvertTo-Json -Depth 10
